const { PrismaClient } = require('@prisma/client');
const { sendAlertEmail } = require('../lib/email');

const prisma = new PrismaClient();

async function createTestAlert() {
  try {
    console.log('🚀 Création d\'une alerte de test...');

    // Données de l'alerte de test
    const testAlertData = {
      message: "Test d'alerte - Pression artérielle élevée détectée",
      messageRole: "technician",
      type: "Blood Pressure Alarm",
      requiredAction: "Vérifier les paramètres de pression et ajuster si nécessaire",
      priority: "high", // "low", "medium", "high", "critical"
      machineId: "M001", // Utilise une machine existante
      status: "active"
    };

    // Vérifier que la machine existe
    const machine = await prisma.machine.findUnique({
      where: { id: testAlertData.machineId },
      select: {
        name: true,
        department: true,
      },
    });

    if (!machine) {
      console.error('❌ Machine non trouvée:', testAlertData.machineId);
      console.log('Machines disponibles:');
      const machines = await prisma.machine.findMany({
        select: { id: true, name: true, department: true }
      });
      machines.forEach(m => console.log(`  - ${m.id}: ${m.name} (${m.department})`));
      return;
    }

    // Créer l'alerte
    const alert = await prisma.alert.create({
      data: {
        message: testAlertData.message,
        messageRole: testAlertData.messageRole,
        type: testAlertData.type,
        requiredAction: testAlertData.requiredAction,
        priority: testAlertData.priority,
        timestamp: new Date(),
        status: testAlertData.status,
        machineId: testAlertData.machineId,
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
      },
    });

    console.log('✅ Alerte créée avec succès:');
    console.log(`  - ID: ${alert.id}`);
    console.log(`  - Message: ${alert.message}`);
    console.log(`  - Type: ${alert.type}`);
    console.log(`  - Priorité: ${alert.priority}`);
    console.log(`  - Machine: ${alert.machine.name} (${alert.machine.inventoryNumber})`);
    console.log(`  - Département: ${alert.machine.department}`);
    console.log(`  - Statut: ${alert.status}`);
    console.log(`  - Timestamp: ${alert.timestamp}`);

    console.log('\n📋 Résumé:');
    console.log('  - L\'alerte a été créée dans la base de données');
    console.log('  - Elle apparaîtra dans la page /dashboard/technician/alerts');
    console.log('  - Elle sera visible dans le dropdown d\'alertes de la navbar');

    // Envoi de l'email d'alerte au technicien
    const emailResult = await sendAlertEmail({
      message: alert.message,
      messageRole: alert.messageRole,
      type: alert.type,
      requiredAction: alert.requiredAction,
      priority: alert.priority,
      machineId: alert.machineId,
      machineName: alert.machine.name,
      department: alert.machine.department,
    });
    if (emailResult.success) {
      console.log('📧 Email d\'alerte envoyé avec succès au(x) technicien(s).');
    } else {
      console.error('❌ Erreur lors de l\'envoi de l\'email d\'alerte:', emailResult.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'alerte:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createTestAlert(); 