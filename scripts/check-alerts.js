const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAlerts() {
  try {
    console.log('🔍 Vérification des alertes dans la base de données...');
    
    // Vérifier toutes les alertes
    const allAlerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📋 Total des alertes: ${allAlerts.length}`);
    
    // Vérifier les alertes d'interventions
    const interventionAlerts = await prisma.alert.findMany({
      where: {
        OR: [
          { type: "intervention_created" },
          { type: "intervention_reminder" }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Alertes d'interventions: ${interventionAlerts.length}`);
    
    interventionAlerts.forEach((alert, index) => {
      console.log(`\n  Alerte #${index + 1}:`);
      console.log(`    - ID: ${alert.id}`);
      console.log(`    - Message: ${alert.message}`);
      console.log(`    - Type: ${alert.type}`);
      console.log(`    - Priorité: ${alert.priority}`);
      console.log(`    - Status: ${alert.status}`);
      console.log(`    - Créée: ${alert.createdAt.toLocaleString()}`);
    });
    
    // Vérifier les alertes récentes (dernières 10 minutes)
    const recentAlerts = await prisma.alert.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // 10 dernières minutes
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📋 Alertes récentes (10 dernières minutes): ${recentAlerts.length}`);
    
    recentAlerts.forEach((alert, index) => {
      console.log(`\n  Alerte récente #${index + 1}:`);
      console.log(`    - ID: ${alert.id}`);
      console.log(`    - Message: ${alert.message}`);
      console.log(`    - Type: ${alert.type}`);
      console.log(`    - Priorité: ${alert.priority}`);
      console.log(`    - Créée: ${alert.createdAt.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
checkAlerts(); 