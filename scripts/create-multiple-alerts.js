const { PrismaClient } = require('@prisma/client');
const { sendAlertEmail } = require('../lib/email');

const prisma = new PrismaClient();

async function createMultipleAlerts() {
  try {
    console.log('🚀 Création de plusieurs alertes de test...');

    // Liste d'alertes de test variées
    const testAlerts = [
      {
        message: "Pression artérielle élevée détectée - 180/110 mmHg",
        messageRole: "technician",
        type: "Blood Pressure Alarm",
        requiredAction: "Vérifier les paramètres de pression et ajuster si nécessaire. Contacter le médecin si persistant.",
        priority: "high",
        machineId: "M001",
        status: "active"
      },
      {
        message: "Fuite d'air détectée dans le circuit sanguin",
        messageRole: "technician",
        type: "Air Leak Alarm",
        requiredAction: "Vérifier immédiatement les connexions, le piège à bulles et les détecteurs d'air.",
        priority: "critical",
        machineId: "M002",
        status: "active"
      },
      {
        message: "Température du dialysat hors limites - 38.5°C",
        messageRole: "technician",
        type: "Temperature Alarm",
        requiredAction: "Vérifier le système de chauffage et ajuster la température à 37°C.",
        priority: "high",
        machineId: "M001",
        status: "active"
      },
      {
        message: "Maintenance préventive requise - 3 mois",
        messageRole: "technician",
        type: "Maintenance Reminder",
        requiredAction: "Effectuer la maintenance programmée : remplacement des filtres, vérification des connexions électriques.",
        priority: "medium",
        machineId: "M002",
        status: "active"
      },
      {
        message: "Conductivité hors limites - 14.2 mS/cm",
        messageRole: "technician",
        type: "Conductivity Alarm",
        requiredAction: "Ajuster la concentration en sel total du patient à 138-145 mmol/l avant de commencer.",
        priority: "medium",
        machineId: "M001",
        status: "active"
      },
      {
        message: "Pression veineuse élevée - 350 mmHg",
        messageRole: "technician",
        type: "Venous Pressure Alarm",
        requiredAction: "Vérifier l'aiguille veineuse, les pinces et la position du patient.",
        priority: "high",
        machineId: "M002",
        status: "active"
      },
      {
        message: "Calibration requise - Capteur de pression",
        messageRole: "technician",
        type: "Calibration Reminder",
        requiredAction: "Effectuer la calibration du capteur de pression avec les outils calibrés.",
        priority: "low",
        machineId: "M001",
        status: "active"
      },
      {
        message: "Niveau de solution dialysante bas",
        messageRole: "technician",
        type: "Solution Level Alarm",
        requiredAction: "Remplir le réservoir de solution dialysante.",
        priority: "medium",
        machineId: "M002",
        status: "active"
      }
    ];

    let createdCount = 0;
    let emailSentCount = 0;

    for (const alertData of testAlerts) {
      try {
        // Vérifier que la machine existe
        const machine = await prisma.machine.findUnique({
          where: { id: alertData.machineId },
          select: {
            name: true,
            department: true,
          },
        });

        if (!machine) {
          console.warn(`⚠️ Machine non trouvée: ${alertData.machineId} - Alerte ignorée`);
          continue;
        }

        // Créer l'alerte
        const alert = await prisma.alert.create({
          data: {
            message: alertData.message,
            messageRole: alertData.messageRole,
            type: alertData.type,
            requiredAction: alertData.requiredAction,
            priority: alertData.priority,
            timestamp: new Date(),
            status: alertData.status,
            machineId: alertData.machineId,
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

        console.log(`✅ Alerte créée: ${alert.type} (${alert.priority}) - ${alert.machine.name}`);

        // Envoyer l'email de notification
        try {
          const emailResult = await sendAlertEmail({
            message: alertData.message,
            messageRole: alertData.messageRole,
            type: alertData.type,
            requiredAction: alertData.requiredAction,
            priority: alertData.priority,
            machineId: alertData.machineId,
            machineName: machine.name,
            department: machine.department,
          });

          if (emailResult.success) {
            emailSentCount++;
            console.log(`  📧 Email envoyé`);
          } else {
            console.warn(`  ⚠️ Échec email: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.warn(`  ⚠️ Erreur email: ${emailError.message}`);
        }

        createdCount++;

        // Petite pause entre les créations
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erreur lors de la création de l'alerte "${alertData.type}":`, error.message);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Alertes créées: ${createdCount}/${testAlerts.length}`);
    console.log(`  - Emails envoyés: ${emailSentCount}`);
    console.log('\n🎯 Prochaines étapes:');
    console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
    console.log('  - Vérifiez le dropdown d\'alertes dans la navbar');
    console.log('  - Testez les filtres par priorité et type');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createMultipleAlerts(); 