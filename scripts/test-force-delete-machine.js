const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testForceDeleteMachine() {
  console.log('🧪 Testing Force Delete Machine Functionality\n');

  try {
    // 1. Créer une machine de test avec des données liées
    console.log('1. Creating test machine with related data...');
    
    const testMachineId = `MACH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const testInventoryNumber = `TEST-FORCE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    const testMachine = await prisma.machine.create({
      data: {
        id: testMachineId,
        name: 'Test Machine for Force Delete',
        inventoryNumber: testInventoryNumber,
        department: 'Dialysis Unit A',
        status: 'Active',
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   ✅ Created machine: ${testMachine.name} (ID: ${testMachine.id})`);

    // 2. Créer des données liées
    console.log('\n2. Creating related data...');

    // Créer un planning de maintenance
    const maintenanceSchedule = await prisma.maintenanceSchedule.create({
      data: {
        machineId: testMachine.id,
        type: '3min',
        tasks: "[]",
        dueDate: new Date(Date.now() + 3 * 60 * 1000).toISOString().split('T')[0], // format YYYY-MM-DD
        status: 'Pending',
      },
    });
    console.log(`   ✅ Created maintenance schedule (ID: ${maintenanceSchedule.id})`);

    // Créer un contrôle de maintenance
    const maintenanceControl = await prisma.maintenanceControl.create({
      data: {
        machineId: testMachine.id,
        technicianId: "T001", // ID technicien existant
        controlDate: new Date(),
        controlType: "3_months",
        nextControlDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 mois plus tard
        status: "pending",
        notes: "Test control for force delete",
      },
    });
    console.log(`   ✅ Created maintenance control (ID: ${maintenanceControl.id})`);

    // Créer une alerte
    const alert = await prisma.alert.create({
      data: {
        machineId: testMachine.id,
        type: 'maintenance_reminder',
        message: 'Test alert for force delete',
        messageRole: 'Test role',
        requiredAction: 'Test action',
        timestamp: new Date(),
        status: 'active',
        priority: 'medium',
      },
    });
    console.log(`   ✅ Created alert (ID: ${alert.id})`);

    // Créer une panne
    const fault = await prisma.fault.create({
      data: {
        machineId: testMachine.id,
        patientId: "P001", // ID patient existant
        date: new Date().toISOString().split('T')[0],
        faultType: "Test type",
        description: "Test fault for force delete",
        downtime: "1h",
        rootCause: "Test cause",
        correctiveAction: "Test action",
        status: "open",
      },
    });
    console.log(`   ✅ Created fault (ID: ${fault.id})`);

    // 3. Vérifier que la machine a des données liées
    console.log('\n3. Verifying related data exists...');
    
    const machineWithCounts = await prisma.machine.findUnique({
      where: { id: testMachine.id },
      include: {
        _count: {
          select: {
            faults: true,
            alerts: true,
            maintenanceSchedule: true,
            maintenanceControls: true,
          },
        },
      },
    });

    console.log(`   📊 Related data counts:`);
    console.log(`      - Faults: ${machineWithCounts._count.faults}`);
    console.log(`      - Alerts: ${machineWithCounts._count.alerts}`);
    console.log(`      - Maintenance Schedules: ${machineWithCounts._count.maintenanceSchedule}`);
    console.log(`      - Maintenance Controls: ${machineWithCounts._count.maintenanceControls}`);

    // 4. Tester la suppression normale (devrait échouer)
    console.log('\n4. Testing normal delete (should fail)...');
    
    try {
      await prisma.machine.delete({
        where: { id: testMachine.id },
      });
      console.log('   ❌ Normal delete should have failed but succeeded!');
    } catch (error) {
      console.log('   ✅ Normal delete correctly failed due to related data');
      console.log(`   📝 Error: ${error.message}`);
    }

    // 5. Tester la suppression forcée via l'API
    console.log('\n5. Testing force delete via API...');
    
    const response = await fetch(`http://localhost:3001/api/machines/${testMachine.id}?force=true`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Force delete successful!');
      console.log(`   📝 Message: ${result.message}`);
      console.log(`   🗑️ Deleted data:`, result.deletedData);
    } else {
      const error = await response.json();
      console.log('   ❌ Force delete failed!');
      console.log(`   📝 Error: ${error.error}`);
    }

    // 6. Vérifier que la machine et toutes les données liées ont été supprimées
    console.log('\n6. Verifying all data has been deleted...');
    
    const deletedMachine = await prisma.machine.findUnique({
      where: { id: testMachine.id },
    });
    
    const deletedFault = await prisma.fault.findUnique({
      where: { id: fault.id },
    });
    
    const deletedAlert = await prisma.alert.findUnique({
      where: { id: alert.id },
    });
    
    const deletedSchedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: maintenanceSchedule.id },
    });
    
    const deletedControl = await prisma.maintenanceControl.findUnique({
      where: { id: maintenanceControl.id },
    });

    console.log(`   🗑️ Machine deleted: ${deletedMachine ? '❌ No' : '✅ Yes'}`);
    console.log(`   🗑️ Fault deleted: ${deletedFault ? '❌ No' : '✅ Yes'}`);
    console.log(`   🗑️ Alert deleted: ${deletedAlert ? '❌ No' : '✅ Yes'}`);
    console.log(`   🗑️ Schedule deleted: ${deletedSchedule ? '❌ No' : '✅ Yes'}`);
    console.log(`   🗑️ Control deleted: ${deletedControl ? '❌ No' : '✅ Yes'}`);

    console.log('\n🎉 Force delete test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testForceDeleteMachine(); 