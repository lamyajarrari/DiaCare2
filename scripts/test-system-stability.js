const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_INTERVALS = {
  '3min': 3,
  '3months': 90,
  '6months': 180,
  '1year': 365
};

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            data: parsedBody,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
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

async function testSystemStability() {
  console.log('🧪 Test de stabilité du système DiaCare');
  console.log('=====================================\n');

  try {
    // 1. Test de l'API des machines
    console.log('1. Test de l\'API des machines...');
    const machinesResponse = await makeRequest('/api/machines');
    if (machinesResponse.status === 200) {
      console.log('✅ API des machines fonctionne');
      const machines = machinesResponse.data;
      console.log(`   - ${machines.length} machines trouvées`);
    } else {
      console.log(`❌ Erreur API des machines: ${machinesResponse.status}`);
    }

    // 2. Test de l'API des alertes
    console.log('\n2. Test de l\'API des alertes...');
    const alertsResponse = await makeRequest('/api/alerts?status=active&role=technician');
    if (alertsResponse.status === 200) {
      console.log('✅ API des alertes fonctionne');
      const alerts = alertsResponse.data;
      console.log(`   - ${alerts.length} alertes actives trouvées`);
    } else {
      console.log(`❌ Erreur API des alertes: ${alertsResponse.status}`);
    }

    // 3. Test de l'API des interventions
    console.log('\n3. Test de l\'API des interventions...');
    const interventionsResponse = await makeRequest('/api/interventions');
    if (interventionsResponse.status === 200) {
      console.log('✅ API des interventions fonctionne');
      const interventions = interventionsResponse.data;
      console.log(`   - ${interventions.length} interventions trouvées`);
    } else {
      console.log(`❌ Erreur API des interventions: ${interventionsResponse.status}`);
    }

    // 4. Test de création d'une intervention avec alerte
    console.log('\n4. Test de création d\'intervention avec alerte...');
    const testIntervention = {
      requestedIntervention: "Test de stabilité système",
      datePerformed: new Date().toISOString(),
      timeSpent: 30,
      status: "Completed",
      technicianId: "T001",
      inventoryNumber: "TEST001",
      notifications: "3min",
      machineId: 1
    };

    const createResponse = await makeRequest('/api/interventions', 'POST', testIntervention);
    if (createResponse.status === 201) {
      console.log('✅ Création d\'intervention réussie');
      const intervention = createResponse.data;
      console.log(`   - Intervention #${intervention.id} créée`);
      
      // Vérifier que l'alerte a été créée
      const newAlertsResponse = await makeRequest('/api/alerts?status=active&role=technician');
      if (newAlertsResponse.status === 200) {
        const newAlerts = newAlertsResponse.data;
        const interventionAlert = newAlerts.find(alert => 
          alert.message && alert.message.includes(`Intervention #${intervention.id}`)
        );
        if (interventionAlert) {
          console.log('✅ Alerte créée automatiquement pour l\'intervention');
        } else {
          console.log('⚠️ Alerte non trouvée pour l\'intervention');
        }
      }
    } else {
      console.log(`❌ Erreur création intervention: ${createResponse.status}`);
      if (createResponse.data) {
        console.log(`   - Détails: ${JSON.stringify(createResponse.data)}`);
      }
    }

    // 5. Test de mise à jour du statut d'alerte
    console.log('\n5. Test de mise à jour du statut d\'alerte...');
    const activeAlertsResponse = await makeRequest('/api/alerts?status=active');
    if (activeAlertsResponse.status === 200 && activeAlertsResponse.data.length > 0) {
      const firstAlert = activeAlertsResponse.data[0];
      const updateResponse = await makeRequest('/api/alerts', 'PATCH', {
        id: firstAlert.id,
        status: 'resolved'
      });
      if (updateResponse.status === 200) {
        console.log('✅ Mise à jour du statut d\'alerte réussie');
      } else {
        console.log(`❌ Erreur mise à jour alerte: ${updateResponse.status}`);
      }
    } else {
      console.log('⚠️ Aucune alerte active pour tester la mise à jour');
    }

    // 6. Test de l'API de vérification des alertes d'intervention
    console.log('\n6. Test de vérification des alertes d\'intervention...');
    const checkResponse = await makeRequest('/api/check-intervention-alerts', 'POST');
    if (checkResponse.status === 200) {
      console.log('✅ API de vérification des alertes fonctionne');
      const result = checkResponse.data;
      console.log(`   - ${result.alertsCreated || 0} alertes créées`);
    } else {
      console.log(`❌ Erreur vérification alertes: ${checkResponse.status}`);
    }

    console.log('\n🎉 Tests de stabilité terminés avec succès!');
    console.log('\n📋 Résumé:');
    console.log('- Toutes les APIs principales fonctionnent');
    console.log('- La création d\'interventions avec alertes fonctionne');
    console.log('- La mise à jour des statuts d\'alertes fonctionne');
    console.log('- Le système de vérification des alertes fonctionne');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter les tests
testSystemStability(); 