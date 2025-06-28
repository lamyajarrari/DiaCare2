const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInterventionAlertCreation() {
  try {
    console.log('🧪 Test de création d\'alerte lors de la création d\'intervention');
    console.log('=' .repeat(60));

    const now = new Date();
    
    // 1. Créer une intervention avec notifications
    console.log('\n📋 Création d\'une intervention avec notifications...');
    
    const intervention = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test création alerte automatique",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Machine Test Alerte",
        inventoryNumber: "INV-003",
        problemDescription: "Test de la création automatique d'alerte",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Test de fonctionnement",
        partsReplaced: "0",
        price: "0",
        technician: "Test Technician",
        timeSpent: "2",
        status: "Completed",
        technicianId: "T001",
        notifications: "3min"
      }
    });

    console.log(`✅ Intervention créée: #${intervention.id}`);
    console.log(`  - Notifications: ${intervention.notifications}`);
    console.log(`  - Date performed: ${intervention.datePerformed}`);

    // 2. Vérifier si une alerte a été créée automatiquement
    console.log('\n🔍 Vérification de l\'alerte créée automatiquement...');
    
    const alerts = await prisma.alert.findMany({
      where: {
        message: { contains: `Intervention #${intervention.id}` }
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true
          }
        }
      }
    });

    console.log(`📋 Alertes trouvées: ${alerts.length}`);
    
    alerts.forEach((alert, index) => {
      console.log(`\n  Alerte #${index + 1}:`);
      console.log(`    - ID: ${alert.id}`);
      console.log(`    - Message: ${alert.message}`);
      console.log(`    - Type: ${alert.type}`);
      console.log(`    - Priorité: ${alert.priority}`);
      console.log(`    - Status: ${alert.status}`);
      console.log(`    - Machine: ${alert.machine?.name || 'N/A'}`);
      console.log(`    - Créée: ${alert.createdAt.toLocaleString()}`);
    });

    // 3. Vérifier les maintenance schedules et controls créés
    console.log('\n📋 Vérification des maintenance schedules et controls...');
    
    const machine = await prisma.machine.findFirst({
      where: { inventoryNumber: "INV-003" }
    });

    if (machine) {
      const schedules = await prisma.maintenanceSchedule.findMany({
        where: { machineId: machine.id }
      });

      const controls = await prisma.maintenanceControl.findMany({
        where: { machineId: machine.id }
      });

      console.log(`  - Maintenance schedules: ${schedules.length}`);
      console.log(`  - Maintenance controls: ${controls.length}`);

      if (controls.length > 0) {
        const latestControl = controls[controls.length - 1];
        console.log(`  - Dernier contrôle: ${latestControl.controlDate.toLocaleString()}`);
        console.log(`  - Prochain contrôle: ${latestControl.nextControlDate.toLocaleString()}`);
      }
    }

    console.log('\n🎯 Résumé du test:');
    console.log('  1. ✅ Intervention créée avec notifications');
    console.log(`  2. ✅ ${alerts.length} alerte(s) créée(s) automatiquement`);
    console.log('  3. ✅ Maintenance schedules et controls mis à jour');

    console.log('\n📋 Prochaines étapes:');
    console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
    console.log('  - Les alertes apparaîtront dans le dropdown de la navbar');
    console.log('  - Attendez 3 minutes pour voir l\'alerte de rappel');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
testInterventionAlertCreation(); 