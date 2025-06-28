const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInterventionAlerts() {
  try {
    console.log('🔍 Vérification des alertes d\'interventions...');
    console.log('=' .repeat(60));

    const now = new Date();
    let alertsCreated = 0;

    // 1. Vérifier les interventions avec notifications qui ont une datePerformed
    const interventions = await prisma.intervention.findMany({
      where: {
        AND: [
          { notifications: { not: null } },
          { datePerformed: { not: null } },
          { status: "Completed" }
        ]
      },
      include: {
        technicianUser: {
          select: {
            name: true,
            technicianId: true
          }
        }
      }
    });

    console.log(`📋 Trouvé ${interventions.length} interventions avec notifications`);

    for (const intervention of interventions) {
      const performedDate = new Date(intervention.datePerformed);
      let nextControlDate = new Date(performedDate);

      // Calculer la prochaine date de contrôle selon le type de notification
      switch (intervention.notifications) {
        case "3min":
          nextControlDate.setMinutes(performedDate.getMinutes() + 3);
          break;
        case "3months":
          nextControlDate.setMonth(performedDate.getMonth() + 3);
          break;
        case "6months":
          nextControlDate.setMonth(performedDate.getMonth() + 6);
          break;
        case "1year":
          nextControlDate.setFullYear(performedDate.getFullYear() + 1);
          break;
        default:
          continue; // Ignorer les notifications non reconnues
      }

      // Vérifier si la date de contrôle est atteinte ou dépassée
      if (now >= nextControlDate) {
        console.log(`\n🔍 Vérification de l'intervention #${intervention.id}:`);
        console.log(`  - Machine: ${intervention.equipmentDescription}`);
        console.log(`  - Notifications: ${intervention.notifications}`);
        console.log(`  - Date performed: ${performedDate.toLocaleString()}`);
        console.log(`  - Prochaine date de contrôle: ${nextControlDate.toLocaleString()}`);
        console.log(`  - Temps écoulé: ${Math.floor((now - nextControlDate) / (1000 * 60))} minutes`);

        // Vérifier si une alerte existe déjà pour cette intervention
        const existingAlert = await prisma.alert.findFirst({
          where: {
            type: "intervention_reminder",
            message: { contains: `Intervention #${intervention.id}` }
          }
        });

        if (!existingAlert) {
          // Créer une alerte pour cette intervention
          const alertMessage = `Rappel: Intervention #${intervention.id} (${intervention.requestedIntervention}) nécessite un contrôle selon le cycle ${intervention.notifications}`;

          // Trouver la machine par inventoryNumber
          const machine = await prisma.machine.findFirst({
            where: { inventoryNumber: intervention.inventoryNumber }
          });

          if (machine) {
            const alert = await prisma.alert.create({
              data: {
                message: alertMessage,
                messageRole: "technician",
                type: "intervention_reminder",
                requiredAction: "Effectuer le contrôle de maintenance",
                priority: intervention.notifications === "3min" ? "critical" : "high",
                timestamp: new Date(),
                status: "active",
                machineId: machine.id
              }
            });

            console.log(`✅ Alerte créée: ${alert.message} (${alert.priority})`);
            alertsCreated++;
          }
        } else {
          console.log(`ℹ️ Alerte déjà existante pour l'intervention #${intervention.id}`);
        }
      }
    }

    // 2. Créer des alertes pour les interventions récentes (moins de 1 heure)
    const recentInterventions = await prisma.intervention.findMany({
      where: {
        AND: [
          { notifications: { not: null } },
          { datePerformed: { not: null } },
          { status: "Completed" },
          { 
            createdAt: { 
              gte: new Date(now.getTime() - (60 * 60 * 1000)) // Moins d'1 heure
            } 
          }
        ]
      }
    });

    console.log(`\n📋 Vérification des interventions récentes (${recentInterventions.length} trouvées)`);

    for (const intervention of recentInterventions) {
      // Vérifier si une alerte de création existe déjà
      const existingCreationAlert = await prisma.alert.findFirst({
        where: {
          type: "intervention_created",
          message: { contains: `Intervention #${intervention.id}` }
        }
      });

      if (!existingCreationAlert) {
        const alertMessage = `Nouvelle intervention #${intervention.id}: ${intervention.requestedIntervention}. Notifications: ${intervention.notifications}`;

        // Trouver la machine par inventoryNumber
        const machine = await prisma.machine.findFirst({
          where: { inventoryNumber: intervention.inventoryNumber }
        });

        if (machine) {
          const alert = await prisma.alert.create({
            data: {
              message: alertMessage,
              messageRole: "technician",
              type: "intervention_created",
              requiredAction: "Vérifier et planifier le contrôle",
              priority: "medium",
              timestamp: new Date(),
              status: "active",
              machineId: machine.id
            }
          });

          console.log(`✅ Alerte de création: ${alert.message}`);
          alertsCreated++;
        }
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Interventions vérifiées: ${interventions.length}`);
    console.log(`  - Interventions récentes: ${recentInterventions.length}`);
    console.log(`  - Nouvelles alertes créées: ${alertsCreated}`);

    console.log('\n🎯 Prochaines étapes:');
    console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
    console.log('  - Les alertes apparaîtront dans le dropdown de la navbar');
    console.log('  - Les alertes critiques (3min) auront la priorité la plus élevée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des alertes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
checkInterventionAlerts(); 