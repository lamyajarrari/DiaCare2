const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMaintenanceScheduleAlerts() {
  try {
    console.log('🚀 Vérification des maintenances programmées et création d\'alertes...');

    const today = new Date();
    let alertsCreated = 0;

    // Récupérer toutes les maintenances programmées
    const maintenanceSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        status: "Pending" // Seulement les maintenances en attente
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

    console.log(`📋 Trouvé ${maintenanceSchedules.length} maintenances programmées`);

    for (const schedule of maintenanceSchedules) {
      try {
        const dueDate = new Date(schedule.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Déterminer la priorité et le message selon le temps restant
        let priority = "low";
        let urgencyMessage = "";
        let shouldCreateAlert = false;

        if (daysUntilDue <= 0) {
          // Maintenance en retard
          priority = "critical";
          urgencyMessage = `EN RETARD de ${Math.abs(daysUntilDue)} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 7) {
          // Dans les 7 prochains jours
          priority = "high";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 30) {
          // Dans le mois à venir
          priority = "medium";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        } else if (daysUntilDue <= 60) {
          // Dans les 2 mois à venir
          priority = "low";
          urgencyMessage = `dans ${daysUntilDue} jour(s)`;
          shouldCreateAlert = true;
        }

        if (shouldCreateAlert) {
          // Vérifier si une alerte existe déjà pour cette maintenance
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Maintenance ${schedule.type} - ${schedule.machine.name}`
              },
              status: "active",
              machineId: schedule.machineId
            }
          });

          if (!existingAlert) {
            // Créer l'alerte
            const alertMessage = `Maintenance ${schedule.type} - ${schedule.machine.name} ${urgencyMessage}`;
            
            // Parser les tâches JSON
            let tasks = [];
            try {
              tasks = JSON.parse(schedule.tasks);
            } catch (e) {
              tasks = [schedule.tasks]; // Si ce n'est pas du JSON valide
            }

            const requiredAction = `Effectuer la maintenance ${schedule.type} : ${tasks.join(', ')}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: `Maintenance ${schedule.type}`,
                requiredAction: requiredAction,
                priority: priority,
                timestamp: new Date(),
                status: "active",
                machineId: schedule.machineId,
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

            console.log(`✅ Alerte créée: ${alert.type} (${priority}) - ${alert.machine.name} - ${urgencyMessage}`);
            alertsCreated++;
          } else {
            console.log(`⏭️ Alerte déjà existante pour: ${schedule.machine.name} - ${schedule.type}`);
          }
        }

      } catch (error) {
        console.error(`❌ Erreur lors du traitement de la maintenance ${schedule.id}:`, error.message);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Maintenances vérifiées: ${maintenanceSchedules.length}`);
    console.log(`  - Nouvelles alertes créées: ${alertsCreated}`);

    // Afficher les détails des maintenances trouvées
    if (maintenanceSchedules.length > 0) {
      console.log('\n📅 Détails des maintenances programmées:');
      for (const schedule of maintenanceSchedules) {
        const dueDate = new Date(schedule.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let status = "";
        if (daysUntilDue <= 0) {
          status = `🔴 EN RETARD (${Math.abs(daysUntilDue)} jours)`;
        } else if (daysUntilDue <= 7) {
          status = `🟠 URGENT (${daysUntilDue} jours)`;
        } else if (daysUntilDue <= 30) {
          status = `🟡 PROCHAINEMENT (${daysUntilDue} jours)`;
        } else {
          status = `🟢 PLANIFIÉ (${daysUntilDue} jours)`;
        }

        console.log(`  - ${schedule.machine.name} (${schedule.machine.inventoryNumber})`);
        console.log(`    Type: ${schedule.type} | Date: ${schedule.dueDate} | ${status}`);
      }
    }

    console.log('\n🎯 Prochaines étapes:');
    console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
    console.log('  - Les alertes apparaîtront dans le dropdown de la navbar');
    console.log('  - Les alertes critiques (en retard) auront la priorité la plus élevée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des maintenances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
checkMaintenanceScheduleAlerts(); 