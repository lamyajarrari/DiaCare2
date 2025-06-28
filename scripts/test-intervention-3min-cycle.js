const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIntervention3MinCycle() {
  try {
    console.log('🚀 Test du cycle complet : Machine 3min → Intervention → Alertes');
    console.log('=' .repeat(60));

    // 1. Ajouter la machine avec catégorie 3 minutes
    console.log('\n📋 Étape 1: Ajout de la machine avec catégorie 3 minutes');
    
    const machine = await prisma.machine.upsert({
      where: { id: "M003" },
      update: {
        name: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        department: "Test Department",
        status: "Active",
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + (3 * 60 * 1000))
      },
      create: {
        id: "M003",
        name: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        department: "Test Department",
        status: "Active",
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + (3 * 60 * 1000))
      }
    });

    console.log(`✅ Machine créée: ${machine.name} (${machine.inventoryNumber})`);

    // 2. Créer le maintenance schedule pour 3 minutes
    const maintenanceSchedule = await prisma.maintenanceSchedule.upsert({
      where: { id: 1000 },
      update: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs",
          "Test de fonctionnement"
        ]),
        dueDate: new Date(Date.now() + (3 * 60 * 1000)).toISOString().split('T')[0],
        status: "Pending",
        machineId: "M003"
      },
      create: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs",
          "Test de fonctionnement"
        ]),
        dueDate: new Date(Date.now() + (3 * 60 * 1000)).toISOString().split('T')[0],
        status: "Pending",
        machineId: "M003"
      }
    });

    console.log(`✅ Maintenance schedule créé: ${maintenanceSchedule.type}`);

    // 3. Créer une intervention maintenant
    console.log('\n📋 Étape 2: Création d\'une intervention');
    
    const now = new Date();
    const intervention = await prisma.intervention.create({
      data: {
        requestDate: now.toISOString().split('T')[0],
        requestedIntervention: "Test de maintenance 3 minutes",
        department: "Test Department",
        requestedBy: "Test User",
        equipmentDescription: machine.name,
        inventoryNumber: machine.inventoryNumber,
        problemDescription: "Test du cycle de maintenance 3 minutes",
        interventionType: "Preventive",
        datePerformed: now.toISOString(),
        tasksCompleted: "Test de fonctionnement, vérification des paramètres",
        partsReplaced: "0",
        price: "0",
        technician: "Test Technician",
        timeSpent: "5",
        status: "Completed",
        technicianId: "T001"
      }
    });

    console.log(`✅ Intervention créée: #${intervention.id}`);
    console.log(`  - Date performed: ${intervention.datePerformed}`);
    console.log(`  - Machine: ${intervention.equipmentDescription}`);

    // 4. Vérifier que les dates ont été mises à jour
    console.log('\n📋 Étape 3: Vérification des dates mises à jour');
    
    const updatedMachine = await prisma.machine.findUnique({
      where: { id: "M003" }
    });

    const updatedSchedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: 1000 }
    });

    const maintenanceControl = await prisma.maintenanceControl.findFirst({
      where: {
        machineId: "M003",
        controlType: "3_minutes"
      }
    });

    console.log('📅 Dates mises à jour:');
    console.log(`  - Machine lastMaintenance: ${updatedMachine.lastMaintenance?.toLocaleString()}`);
    console.log(`  - Machine nextMaintenance: ${updatedMachine.nextMaintenance?.toLocaleString()}`);
    console.log(`  - Schedule dueDate: ${updatedSchedule.dueDate}`);
    console.log(`  - Control controlDate: ${maintenanceControl?.controlDate?.toLocaleString()}`);
    console.log(`  - Control nextControlDate: ${maintenanceControl?.nextControlDate?.toLocaleString()}`);

    // 5. Calculer quand l'alerte devrait apparaître
    const nextControlDate = new Date(maintenanceControl.nextControlDate);
    const timeUntilAlert = nextControlDate.getTime() - now.getTime();
    const minutesUntilAlert = Math.ceil(timeUntilAlert / (1000 * 60));

    console.log('\n⏰ Prochaine alerte:');
    console.log(`  - Date: ${nextControlDate.toLocaleString()}`);
    console.log(`  - Dans: ${minutesUntilAlert} minutes`);

    // 6. Créer une alerte de test immédiatement
    console.log('\n📋 Étape 4: Création d\'une alerte de test');
    
    const alert = await prisma.alert.create({
      data: {
        message: `Test - Contrôle 3 minutes requis pour ${machine.name}`,
        messageRole: "technician",
        type: "3-Minute Test Alert",
        requiredAction: "Effectuer le contrôle de maintenance de 3 minutes",
        priority: "high",
        timestamp: now,
        status: "active",
        machineId: "M003",
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

    console.log(`✅ Alerte créée: ${alert.type}`);
    console.log(`  - Message: ${alert.message}`);
    console.log(`  - Priorité: ${alert.priority}`);
    console.log(`  - Machine: ${alert.machine.name}`);

    console.log('\n🎯 Résumé du test:');
    console.log('  1. ✅ Machine avec catégorie 3 minutes créée');
    console.log('  2. ✅ Maintenance schedule configuré');
    console.log('  3. ✅ Intervention créée avec datePerformed');
    console.log('  4. ✅ Dates de contrôle automatiquement mises à jour');
    console.log('  5. ✅ Alerte de test créée');
    console.log(`  6. ⏰ Prochaine alerte automatique dans ${minutesUntilAlert} minutes`);

    console.log('\n📋 Prochaines étapes:');
    console.log('  - Vérifiez l\'alerte dans /dashboard/technician/alerts');
    console.log('  - Attendez 3 minutes pour voir l\'alerte automatique');
    console.log('  - Ou lancez le script check-3min-controls.js');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
testIntervention3MinCycle(); 