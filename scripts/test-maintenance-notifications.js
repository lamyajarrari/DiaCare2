const { PrismaClient } = require("@prisma/client");

// Configuration pour TypeScript
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  },
});

const { sendMaintenanceNotifications } = require("../lib/maintenance-notifications.ts");

const prisma = new PrismaClient();

async function testMaintenanceNotifications() {
  try {
    console.log("🧪 Testing maintenance notifications...");

    // Créer quelques contrôles de test avec des dates proches
    const testControls = [
      {
        machineId: "M001",
        technicianId: "T001",
        controlDate: new Date("2025-06-15"),
        controlType: "3_months",
        nextControlDate: new Date(), // Aujourd'hui (en retard)
        status: "completed",
        notes: "Contrôle de test en retard",
      },
      {
        machineId: "M002",
        technicianId: "T001",
        controlDate: new Date("2025-06-15"),
        controlType: "6_months",
        nextControlDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
        status: "completed",
        notes: "Contrôle de test à venir",
      },
    ];

    // Supprimer les anciens contrôles de test
    await prisma.maintenanceControl.deleteMany({
      where: {
        notes: {
          contains: "Contrôle de test"
        }
      }
    });

    // Créer les nouveaux contrôles de test
    for (const control of testControls) {
      await prisma.maintenanceControl.create({ data: control });
    }

    console.log("✅ Test controls created");

    // Envoyer les notifications
    const results = await sendMaintenanceNotifications();

    console.log("📧 Notification results:");
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`✅ ${result.technicianName}: Email sent successfully`);
        console.log(`   Controls: ${result.controlsCount} machines`);
        console.log(`   Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ ${result.technicianName}: ${result.error}`);
        console.log(`   Controls: ${result.controlsCount} machines`);
      }
    });

    console.log("🎉 Test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testMaintenanceNotifications();
}

module.exports = { testMaintenanceNotifications }; 