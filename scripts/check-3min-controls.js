const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check3MinControls() {
  try {
    console.log('🔍 Vérification des contrôles de 3 minutes...');

    const now = new Date();
    let alertsCreated = 0;

    // 1. Vérifier les contrôles de maintenance avec cycle de 3 minutes
    const maintenanceControls = await prisma.maintenanceControl.findMany({
      where: {
        controlType: "3_minutes",
        status: "completed"
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
    });

    console.log(`📋 Trouvé ${maintenanceControls.length} contrôles de 3 minutes`);

    for (const control of maintenanceControls) {
      try {
        const nextControlDate = new Date(control.nextControlDate);
        const timeUntilNext = nextControlDate.getTime() - now.getTime();
        const minutesUntilNext = Math.ceil(timeUntilNext / (1000 * 60));

        console.log(`\n🔍 Vérification du contrôle #${control.id}:`);
        console.log(`  - Machine: ${control.machine.name}`);
        console.log(`  - Dernier contrôle: ${control.controlDate.toLocaleString()}`);
        console.log(`  - Prochain contrôle: ${nextControlDate.toLocaleString()}`);
        console.log(`  - Temps restant: ${minutesUntilNext} minutes`);

        // Vérifier si c'est le moment de créer une alerte
        let shouldCreateAlert = false;
        let priority = "low";
        let urgencyMessage = "";

        if (minutesUntilNext <= 0) {
          // Contrôle en retard
          priority = "critical";
          urgencyMessage = `EN RETARD de ${Math.abs(minutesUntilNext)} minute(s)`;
          shouldCreateAlert = true;
        } else if (minutesUntilNext <= 1) {
          // Dans la minute
          priority = "high";
          urgencyMessage = `dans ${minutesUntilNext} minute(s)`;
          shouldCreateAlert = true;
        } else if (minutesUntilNext <= 3) {
          // Dans les 3 prochaines minutes
          priority = "medium";
          urgencyMessage = `dans ${minutesUntilNext} minute(s)`;
          shouldCreateAlert = true;
        }

        if (shouldCreateAlert) {
          // Vérifier si une alerte existe déjà
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Contrôle 3 minutes - ${control.machine.name}`
              },
              status: "active",
              machineId: control.machineId
            }
          });

          if (!existingAlert) {
            // Créer l'alerte
            const alertMessage = `Contrôle 3 minutes - ${control.machine.name} ${urgencyMessage}`;
            const alertType = "3-Minute Control";
            const requiredAction = `Effectuer le contrôle technique de 3 minutes sur ${control.machine.name}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: alertType,
                requiredAction: requiredAction,
                priority: priority,
                timestamp: now,
                status: "active",
                machineId: control.machineId,
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

            console.log(`✅ Alerte créée: ${alert.type} (${priority}) - ${alert.machine.name}`);
            alertsCreated++;

            // Mettre à jour la date du prochain contrôle
            const newNextControlDate = new Date(now.getTime() + (3 * 60 * 1000)); // +3 minutes
            
            await prisma.maintenanceControl.update({
              where: { id: control.id },
              data: {
                nextControlDate: newNextControlDate,
                notes: `${control.notes || ''}\nAlerte créée le ${now.toLocaleString()}`
              }
            });

            console.log(`  📅 Prochain contrôle programmé: ${newNextControlDate.toLocaleString()}`);

          } else {
            console.log(`⏭️ Alerte déjà existante pour: ${control.machine.name}`);
          }
        } else {
          console.log(`⏳ Pas encore le moment (${minutesUntilNext} minutes restantes)`);
        }

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du contrôle ${control.id}:`, error.message);
      }
    }

    // 2. Vérifier les maintenance schedules de 3 minutes
    const maintenanceSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        type: "3-minute",
        status: "Pending"
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

    console.log(`\n📅 Vérification des schedules de 3 minutes: ${maintenanceSchedules.length} trouvés`);

    for (const schedule of maintenanceSchedules) {
      try {
        const dueDate = new Date(schedule.dueDate);
        const timeUntilDue = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.ceil(timeUntilDue / (1000 * 60));

        if (minutesUntilDue <= 0) {
          // Vérifier si une alerte existe déjà
          const existingAlert = await prisma.alert.findFirst({
            where: {
              message: {
                contains: `Maintenance 3-minute - ${schedule.machine.name}`
              },
              status: "active",
              machineId: schedule.machineId
            }
          });

          if (!existingAlert) {
            const alertMessage = `Maintenance 3-minute - ${schedule.machine.name} EN RETARD`;
            const alertType = "3-Minute Maintenance";
            
            let tasks = [];
            try {
              tasks = JSON.parse(schedule.tasks);
            } catch (e) {
              tasks = [schedule.tasks];
            }

            const requiredAction = `Effectuer la maintenance 3-minute: ${tasks.join(', ')}`;

            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: alertType,
                requiredAction: requiredAction,
                priority: "critical",
                timestamp: now,
                status: "active",
                machineId: schedule.machineId,
              },
            });

            console.log(`✅ Alerte maintenance créée: ${alert.type} - ${schedule.machine.name}`);
            alertsCreated++;
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement du schedule ${schedule.id}:`, error.message);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Contrôles vérifiés: ${maintenanceControls.length}`);
    console.log(`  - Schedules vérifiés: ${maintenanceSchedules.length}`);
    console.log(`  - Nouvelles alertes créées: ${alertsCreated}`);

    if (alertsCreated > 0) {
      console.log('\n🎯 Prochaines étapes:');
      console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
      console.log('  - Les alertes apparaîtront dans le dropdown de la navbar');
      console.log('  - Les alertes critiques (en retard) auront la priorité la plus élevée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des contrôles 3 minutes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
check3MinControls(); 