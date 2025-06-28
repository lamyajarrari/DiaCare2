const { PrismaClient } = require("@prisma/client");
const { sendMaintenanceEmail } = require("../lib/maintenance-notifications.ts");

const prisma = new PrismaClient();

async function checkMaintenanceControls() {
  try {
    console.log("🔍 Checking maintenance controls for notifications...");

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Récupérer tous les contrôles qui nécessitent une notification
    const controlsToNotify = await prisma.maintenanceControl.findMany({
      where: {
        OR: [
          // Contrôles en retard
          {
            nextControlDate: {
              lt: today,
            },
            status: "completed",
            // Ne pas notifier si déjà notifié récemment
            updatedAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a plus de 24h
            },
          },
          // Contrôles à venir dans les 7 prochains jours
          {
            nextControlDate: {
              gte: today,
              lte: sevenDaysFromNow,
            },
            status: "completed",
            // Ne notifier qu'une fois par jour
            updatedAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a plus de 24h
            },
          },
        ],
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
        technician: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextControlDate: "asc",
      },
    });

    if (controlsToNotify.length === 0) {
      console.log("✅ No maintenance controls require notification");
      return;
    }

    console.log(`📧 Found ${controlsToNotify.length} controls requiring notification`);

    // Grouper par technicien
    const technicianNotifications = new Map();

    for (const control of controlsToNotify) {
      const technicianId = control.technicianId;
      
      if (!technicianNotifications.has(technicianId)) {
        technicianNotifications.set(technicianId, {
          technician: control.technician,
          controls: [],
        });
      }

      const isOverdue = control.nextControlDate < today;
      technicianNotifications.get(technicianId).controls.push({
        id: control.id,
        machine: control.machine,
        controlType: control.controlType,
        nextControlDate: control.nextControlDate,
        isOverdue,
      });
    }

    // Envoyer les notifications par technicien
    const results = [];
    
    for (const [technicianId, data] of technicianNotifications) {
      try {
        const emailResult = await sendMaintenanceEmail({
          technician: data.technician,
          controls: data.controls,
        });

        results.push({
          technicianId,
          technicianName: data.technician.name,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          controlsCount: data.controls.length,
        });

        if (emailResult.success) {
          console.log(`✅ Email sent to ${data.technician.name} for ${data.controls.length} controls`);
          
          // Marquer les contrôles comme notifiés
          for (const control of data.controls) {
            await prisma.maintenanceControl.update({
              where: { id: control.id },
              data: { updatedAt: new Date() },
            });
          }
        } else {
          console.error(`❌ Failed to send email to ${data.technician.name}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${data.technician.name}:`, error);
        results.push({
          technicianId,
          technicianName: data.technician.name,
          success: false,
          error: error.message,
          controlsCount: data.controls.length,
        });
      }
    }

    console.log(`📧 Maintenance control notifications completed. Processed ${results.length} technicians.`);
    return results;
  } catch (error) {
    console.error("❌ Error in checkMaintenanceControls:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkMaintenanceControls()
    .then(() => {
      console.log("🎉 Maintenance control check completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Maintenance control check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkMaintenanceControls }; 