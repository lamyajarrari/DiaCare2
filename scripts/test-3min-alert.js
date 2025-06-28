const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function create3MinAlert() {
  try {
    console.log('🚀 Création d\'une alerte de test avec cycle de 3 minutes...');

    // 1. Simuler une maintenance terminée maintenant
    const now = new Date();
    const nextControlDate = new Date(now.getTime() + (3 * 60 * 1000)); // +3 minutes

    console.log(`📅 Date actuelle: ${now.toLocaleString()}`);
    console.log(`⏰ Prochaine vérification: ${nextControlDate.toLocaleString()}`);

    // 2. Créer ou mettre à jour un contrôle de maintenance
    const maintenanceControl = await prisma.maintenanceControl.upsert({
      where: {
        id: 999 // ID de test
      },
      update: {
        controlDate: now,
        nextControlDate: nextControlDate,
        controlType: "3_minutes",
        status: "completed",
        machineId: "M001",
        technicianId: "T001",
        notes: "Test de contrôle avec cycle de 3 minutes"
      },
      create: {
        controlDate: now,
        nextControlDate: nextControlDate,
        controlType: "3_minutes",
        status: "completed",
        machineId: "M001",
        technicianId: "T001",
        notes: "Test de contrôle avec cycle de 3 minutes"
      }
    });

    console.log('✅ Contrôle de maintenance créé/mis à jour');

    // 3. Créer une alerte de rappel pour 3 minutes
    const alertMessage = `Rappel 3 minutes - Contrôle technique requis`;
    const alertType = "3-Minute Check";
    const requiredAction = "Effectuer un contrôle rapide de la machine après 3 minutes";

    const alert = await prisma.alert.create({
      data: {
        message: alertMessage,
        messageRole: "technician",
        type: alertType,
        requiredAction: requiredAction,
        priority: "high",
        timestamp: now,
        status: "active",
        machineId: "M001",
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
    console.log(`  - Timestamp: ${alert.timestamp.toLocaleString()}`);

    // 4. Créer une maintenance schedule pour 3 minutes
    const maintenanceSchedule = await prisma.maintenanceSchedule.upsert({
      where: {
        id: 999 // ID de test
      },
      update: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs",
          "Test de fonctionnement"
        ]),
        dueDate: nextControlDate.toISOString().split('T')[0],
        status: "Pending"
      },
      create: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs", 
          "Test de fonctionnement"
        ]),
        dueDate: nextControlDate.toISOString().split('T')[0],
        status: "Pending",
        machineId: "M001"
      }
    });

    console.log('✅ Maintenance schedule créée pour 3 minutes');

    console.log('\n📋 Résumé:');
    console.log('  - Contrôle de maintenance terminé maintenant');
    console.log('  - Alerte créée pour rappel dans 3 minutes');
    console.log('  - Prochaine vérification programmée');
    console.log('  - L\'alerte apparaîtra dans /dashboard/technician/alerts');
    console.log('  - Elle sera visible dans le dropdown d\'alertes de la navbar');

    console.log('\n⏰ Pour tester:');
    console.log('  - Attendez 3 minutes');
    console.log('  - Vérifiez que l\'alerte apparaît dans l\'interface');
    console.log('  - Ou lancez le script check-maintenance-schedule-alerts.js');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'alerte 3 minutes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
create3MinAlert(); 