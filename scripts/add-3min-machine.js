const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function add3MinMachine() {
  try {
    console.log('🚀 Ajout d\'une machine avec catégorie 3 minutes...');

    // 1. Ajouter une nouvelle machine avec catégorie 3 minutes
    const machine = await prisma.machine.upsert({
      where: {
        id: "M003" // Nouvelle machine
      },
      update: {
        name: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        department: "Test Department",
        status: "Active",
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + (3 * 60 * 1000)) // +3 minutes
      },
      create: {
        id: "M003",
        name: "Machine Test 3 Minutes",
        inventoryNumber: "INV-003",
        department: "Test Department",
        status: "Active",
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + (3 * 60 * 1000)) // +3 minutes
      }
    });

    console.log('✅ Machine créée:', machine.name);

    // 2. Créer un maintenance schedule pour cette machine avec cycle 3 minutes
    const maintenanceSchedule = await prisma.maintenanceSchedule.upsert({
      where: {
        id: 1000 // ID unique pour cette machine
      },
      update: {
        type: "3-minute",
        tasks: JSON.stringify([
          "Vérification rapide des paramètres",
          "Contrôle des indicateurs",
          "Test de fonctionnement",
          "Vérification de la pression",
          "Contrôle de la température"
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
          "Test de fonctionnement",
          "Vérification de la pression",
          "Contrôle de la température"
        ]),
        dueDate: new Date(Date.now() + (3 * 60 * 1000)).toISOString().split('T')[0],
        status: "Pending",
        machineId: "M003"
      }
    });

    console.log('✅ Maintenance schedule créé pour 3 minutes');

    // 3. Créer un maintenance control initial
    const maintenanceControl = await prisma.maintenanceControl.upsert({
      where: {
        id: 1000 // ID unique
      },
      update: {
        machineId: "M003",
        technicianId: "T001",
        controlDate: new Date(),
        controlType: "3_minutes",
        nextControlDate: new Date(Date.now() + (3 * 60 * 1000)), // +3 minutes
        status: "completed",
        notes: "Configuration initiale pour test 3 minutes"
      },
      create: {
        machineId: "M003",
        technicianId: "T001",
        controlDate: new Date(),
        controlType: "3_minutes",
        nextControlDate: new Date(Date.now() + (3 * 60 * 1000)), // +3 minutes
        status: "completed",
        notes: "Configuration initiale pour test 3 minutes"
      }
    });

    console.log('✅ Maintenance control créé');

    console.log('\n📋 Résumé:');
    console.log(`  - Machine: ${machine.name} (${machine.inventoryNumber})`);
    console.log(`  - Département: ${machine.department}`);
    console.log(`  - Cycle de maintenance: 3 minutes`);
    console.log(`  - Prochaine maintenance: ${maintenanceSchedule.dueDate}`);
    console.log(`  - Prochain contrôle: ${maintenanceControl.nextControlDate.toLocaleString()}`);

    console.log('\n🎯 Prochaines étapes:');
    console.log('  1. Créez une intervention sur cette machine');
    console.log('  2. La datePerformed sera utilisée comme controlDate');
    console.log('  3. Le système calculera automatiquement la nextControlDate (+3 min)');
    console.log('  4. Une alerte sera créée après 3 minutes');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la machine 3 minutes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
add3MinMachine(); 