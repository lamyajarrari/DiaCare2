const http = require('http');

async function testApiIntervention() {
  try {
    console.log('🧪 Test de l\'API des interventions avec création d\'alerte');
    console.log('=' .repeat(60));

    const now = new Date();
    
    // 1. Créer une intervention via l'API
    console.log('\n📋 Création d\'une intervention via l\'API...');
    
    const interventionData = {
      requestDate: now.toISOString().split('T')[0],
      requestedIntervention: "Test API création alerte automatique",
      department: "Test Department",
      requestedBy: "Test User",
      equipmentDescription: "Machine Test API",
      inventoryNumber: "INV-003",
      problemDescription: "Test de la création automatique d'alerte via API",
      interventionType: "Preventive",
      datePerformed: now.toISOString(),
      tasksCompleted: "Test de fonctionnement via API",
      partsReplaced: "0",
      price: "0",
      technician: "Test Technician",
      timeSpent: "3",
      status: "Completed",
      technicianId: "T001",
      notifications: "3min"
    };

    // Fonction pour faire une requête HTTP
    function makeRequest(path, method = 'GET', data = null) {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: path,
          method: method,
          headers: {
            'Content-Type': 'application/json',
          }
        };

        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(body);
              resolve({ status: res.statusCode, data: jsonData });
            } catch (error) {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        if (data) {
          req.write(JSON.stringify(data));
        }
        req.end();
      });
    }

    // Créer l'intervention
    const interventionResponse = await makeRequest('/api/interventions', 'POST', interventionData);
    
    if (interventionResponse.status !== 201) {
      throw new Error(`HTTP error! status: ${interventionResponse.status}`);
    }

    const intervention = interventionResponse.data;
    console.log(`✅ Intervention créée via API: #${intervention.id}`);
    console.log(`  - Notifications: ${intervention.notifications}`);
    console.log(`  - Date performed: ${intervention.datePerformed}`);

    // 2. Vérifier les alertes créées
    console.log('\n🔍 Vérification des alertes créées...');
    
    const alertsResponse = await makeRequest('/api/alerts');
    if (alertsResponse.status === 200) {
      const alerts = alertsResponse.data;
      const interventionAlerts = alerts.filter(alert => 
        alert.message && alert.message.includes(`Intervention #${intervention.id}`)
      );
      
      console.log(`📋 Alertes trouvées pour l'intervention #${intervention.id}: ${interventionAlerts.length}`);
      
      interventionAlerts.forEach((alert, index) => {
        console.log(`\n  Alerte #${index + 1}:`);
        console.log(`    - ID: ${alert.id}`);
        console.log(`    - Message: ${alert.message}`);
        console.log(`    - Type: ${alert.type}`);
        console.log(`    - Priorité: ${alert.priority}`);
        console.log(`    - Status: ${alert.status}`);
        console.log(`    - Créée: ${new Date(alert.createdAt).toLocaleString()}`);
      });
    }

    // 3. Vérifier les interventions
    console.log('\n📋 Vérification des interventions...');
    
    const interventionsResponse = await makeRequest('/api/interventions');
    if (interventionsResponse.status === 200) {
      const interventions = interventionsResponse.data;
      const recentInterventions = interventions.filter(i => 
        i.notifications && i.createdAt && 
        new Date(i.createdAt) > new Date(now.getTime() - 5 * 60 * 1000) // 5 dernières minutes
      );
      
      console.log(`📋 Interventions récentes avec notifications: ${recentInterventions.length}`);
      
      recentInterventions.forEach((intervention, index) => {
        console.log(`\n  Intervention #${index + 1}:`);
        console.log(`    - ID: ${intervention.id}`);
        console.log(`    - Description: ${intervention.requestedIntervention}`);
        console.log(`    - Notifications: ${intervention.notifications}`);
        console.log(`    - Status: ${intervention.status}`);
        console.log(`    - Créée: ${new Date(intervention.createdAt).toLocaleString()}`);
      });
    }

    console.log('\n🎯 Résumé du test:');
    console.log('  1. ✅ Intervention créée via API');
    console.log('  2. ✅ Vérification des alertes effectuée');
    console.log('  3. ✅ Vérification des interventions effectuée');

    console.log('\n📋 Prochaines étapes:');
    console.log('  - Vérifiez les alertes dans /dashboard/technician/alerts');
    console.log('  - Les alertes apparaîtront dans le dropdown de la navbar');
    console.log('  - Attendez 3 minutes pour voir l\'alerte de rappel');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)');
  }
}

// Exécuter le script
testApiIntervention(); 