const { PrismaClient } = require("@prisma/client");
const { sendAlertEmail } = require("../lib/email.js");

const prisma = new PrismaClient();

async function checkInterventionReminders() {
  console.log("🔍 Checking intervention reminders...");

  try {
    // Récupérer toutes les interventions terminées
    const completedInterventions = await prisma.intervention.findMany({
      where: {
        status: "Completed",
        datePerformed: {
          not: null
        }
      },
      include: {
        technicianUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const today = new Date();
    let alertsCreated = 0;

    for (const intervention of completedInterventions) {
      if (!intervention.datePerformed) continue;

      const performedDate = new Date(intervention.datePerformed);
      
      // Calculer les dates de rappel (3 mois, 6 mois, 1 an)
      const threeMonthsLater = new Date(performedDate);
      threeMonthsLater.setMonth(performedDate.getMonth() + 3);
      
      const sixMonthsLater = new Date(performedDate);
      sixMonthsLater.setMonth(performedDate.getMonth() + 6);
      
      const oneYearLater = new Date(performedDate);
      oneYearLater.setFullYear(performedDate.getFullYear() + 1);

      // Vérifier si on est à la date de rappel (± 1 jour)
      const isThreeMonthReminder = Math.abs(today - threeMonthsLater) <= 24 * 60 * 60 * 1000;
      const isSixMonthReminder = Math.abs(today - sixMonthsLater) <= 24 * 60 * 60 * 1000;
      const isOneYearReminder = Math.abs(today - oneYearLater) <= 24 * 60 * 60 * 1000;

      if (isThreeMonthReminder || isSixMonthReminder || isOneYearReminder) {
        const reminderType = isThreeMonthReminder ? "3 mois" : isSixMonthReminder ? "6 mois" : "1 an";
        
        // Vérifier si une alerte de rappel existe déjà pour cette intervention
        const existingAlert = await prisma.alert.findFirst({
          where: {
            message: {
              contains: `Rappel ${reminderType} - Intervention #${intervention.id}`
            },
            status: "active"
          }
        });

        if (!existingAlert) {
          // Créer l'alerte de rappel
          const alertMessage = `Rappel ${reminderType} - Intervention #${intervention.id}`;
          const alertType = "Maintenance Reminder";
          const requiredAction = `Vérifier l'état de l'équipement après l'intervention ${intervention.requestedIntervention}`;
          
          const alert = await prisma.alert.create({
            data: {
              message: alertMessage,
              messageRole: "technician",
              type: alertType,
              requiredAction: requiredAction,
              priority: "medium",
              timestamp: today,
              status: "active",
              machineId: intervention.inventoryNumber // Utiliser l'inventoryNumber comme machineId
            }
          });

          // Envoyer l'email de rappel
          if (intervention.technicianUser?.email) {
            try {
              await sendAlertEmail({
                message: alertMessage,
                messageRole: "technician",
                type: alertType,
                requiredAction: requiredAction,
                priority: "medium",
                machineId: intervention.inventoryNumber,
                machineName: intervention.equipmentDescription,
                department: intervention.department
              });
              
              console.log(`✅ Reminder email sent to ${intervention.technicianUser.email} for intervention #${intervention.id}`);
            } catch (emailError) {
              console.error(`❌ Failed to send reminder email for intervention #${intervention.id}:`, emailError);
            }
          }

          alertsCreated++;
          console.log(`✅ Created ${reminderType} reminder alert for intervention #${intervention.id}`);
        }
      }
    }

    console.log(`🎯 Process completed. Created ${alertsCreated} reminder alerts.`);

  } catch (error) {
    console.error("❌ Error checking intervention reminders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  checkInterventionReminders();
}

module.exports = { checkInterventionReminders }; 