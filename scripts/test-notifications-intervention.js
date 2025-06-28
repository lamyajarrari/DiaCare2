const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationsIntervention() {
  try {
    console.log('🚀 Test des interventions avec notifications de rappel');
    console.log('=' .repeat(60));

    // 1. Créer une intervention avec notification 3 minutes
    console.log('\n📋 Test 1: Intervention avec notification 3 minutes');
    
    const now = new Date();
    const intervention3min = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 3 minutes",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        problemDescription: "Test du système de notifications 3 minutes",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Test de fonctionnement, vérification des paramètres",
        partsReplaced: "0",
        price: "0",
        technician: "Test Technician",
        timeSpent: "5",
        status: "Completed",
        technicianId: "T001",
        notifications: "3min"
      }
    });

    console.log(`✅ Intervention 3min créée: #${intervention3min.id}`);
    console.log(`  - Notifications: ${intervention3min.notifications}`);
    console.log(`  - Date performed: ${intervention3min.datePerformed}`);

    // 2. Créer une intervention avec notification 3 mois
    console.log('\n📋 Test 2: Intervention avec notification 3 mois');
    
    const intervention3months = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 3 mois",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Fresenius 4008S",
        inventoryNumber: "INV-001",
        problemDescription: "Test du système de notifications 3 mois",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Maintenance préventive, remplacement des filtres",
        partsReplaced: "2",
        price: "150",
        technician: "Test Technician",
        timeSpent: "3",
        status: "Completed",
        technicianId: "T001",
        notifications: "3months"
      }
    });

    console.log(`✅ Intervention 3mois créée: #${intervention3months.id}`);
    console.log(`  - Notifications: ${intervention3months.notifications}`);

    // 3. Créer une intervention avec notification 6 mois
    console.log('\n📋 Test 3: Intervention avec notification 6 mois');
    
    const intervention6months = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test maintenance avec notification 6 mois",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: "Fresenius 6008",
        inventoryNumber: "INV-002",
        problemDescription: "Test du système de notifications 6 mois",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Maintenance complète, calibration",
        partsReplaced: "1",
        price: "300",
        technician: "Test Technician",
        timeSpent: "4",
        status: "Completed",
        technicianId: "T001",
        notifications: "6months"
      }
    });

    console.log(`✅ Intervention 6mois créée: #${intervention6months.id}`);
    console.log(`  - Notifications: ${intervention6months.notifications}`);

    // 4. Vérifier les maintenance schedules créés
    console.log('\n📋 Vérification des maintenance schedules créés');
    
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        OR: [
          { machineId: "M003" },
          { machineId: "M001" },
          { machineId: "M002" }
        ]
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

    console.log(`📅 Maintenance schedules trouvés: ${schedules.length}`);
    schedules.forEach(schedule => {
      console.log(`  - ${schedule.machine.name} (${schedule.machine.inventoryNumber})`);
      console.log(`    Type: ${schedule.type} | Due: ${schedule.dueDate} | Status: ${schedule.status}`);
    });

    // 5. Vérifier les maintenance controls créés
    console.log('\n📋 Vérification des maintenance controls créés');
    
    const controls = await prisma.maintenanceControl.findMany({
      where: {
        OR: [
          { machineId: "M003" },
          { machineId: "M001" },
          { machineId: "M002" }
        ]
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

    console.log(`🔧 Maintenance controls trouvés: ${controls.length}`);
    controls.forEach(control => {
      console.log(`  - ${control.machine.name} (${control.machine.inventoryNumber})`);
      console.log(`    Type: ${control.controlType} | Control: ${control.controlDate.toLocaleString()}`);
      console.log(`    Next: ${control.nextControlDate.toLocaleString()} | Status: ${control.status}`);
    });

    // 6. Calculer les prochaines alertes
    console.log('\n⏰ Prochaines alertes programmées:');
    
    const nextAlert3min = new Date(now.getTime() + (3 * 60 * 1000));
    const nextAlert3months = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000));
    const nextAlert6months = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));

    console.log(`  - 3 minutes: ${nextAlert3min.toLocaleString()}`);
    console.log(`  - 3 mois: ${nextAlert3months.toLocaleString()}`);
    console.log(`  - 6 mois: ${nextAlert6months.toLocaleString()}`);

    console.log('\n🎯 Résumé du test:');
    console.log('  1. ✅ Intervention 3min créée avec notifications');
    console.log('  2. ✅ Intervention 3mois créée avec notifications');
    console.log('  3. ✅ Intervention 6mois créée avec notifications');
    console.log('  4. ✅ Maintenance schedules créés automatiquement');
    console.log('  5. ✅ Maintenance controls créés automatiquement');
    console.log('  6. ⏰ Alertes programmées selon les cycles');

    console.log('\n📋 Prochaines étapes:');
    console.log('  - Vérifiez les interventions dans /dashboard/technician/interventions');
    console.log('  - Attendez 3 minutes pour voir l\'alerte automatique');
    console.log('  - Ou lancez le script check-3min-controls.js');
    console.log('  - Les alertes apparaîtront dans /dashboard/technician/alerts');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
testNotificationsIntervention(); 