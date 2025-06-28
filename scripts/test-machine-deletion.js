const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';

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

async function testMachineDeletion() {
  console.log('🧪 Test de suppression des machines');
  console.log('==================================\n');

  try {
    // 1. Créer une machine de test sans données liées
    console.log('1. Création d\'une machine de test...');
    const testMachineData = {
      name: "Machine Test Suppression",
      inventoryNumber: "TEST-DELETE-001",
      department: "Test Department",
      status: "Active",
      lastMaintenance: new Date().toISOString().split("T")[0],
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    const createResponse = await makeRequest('/api/machines', 'POST', testMachineData);
    if (createResponse.status === 201) {
      console.log('✅ Machine de test créée');
      const testMachine = createResponse.data;
      console.log(`   - ID: ${testMachine.id}`);
      console.log(`   - Nom: ${testMachine.name}`);
      
      // 2. Tester la suppression de cette machine
      console.log('\n2. Test de suppression de la machine de test...');
      const deleteResponse = await makeRequest(`/api/machines/${testMachine.id}`, 'DELETE');
      
      if (deleteResponse.status === 200) {
        console.log('✅ Suppression réussie!');
        console.log(`   - Machine supprimée: ${deleteResponse.data.deletedMachine.name}`);
        console.log(`   - Message: ${deleteResponse.data.message}`);
      } else {
        console.log(`❌ Erreur lors de la suppression: ${deleteResponse.status}`);
        if (deleteResponse.data) {
          console.log(`   - Détails: ${JSON.stringify(deleteResponse.data)}`);
        }
      }

      // 3. Vérifier que la machine a bien été supprimée
      console.log('\n3. Vérification de la suppression...');
      const verifyResponse = await makeRequest(`/api/machines/${testMachine.id}`);
      if (verifyResponse.status === 404) {
        console.log('✅ Machine bien supprimée (404 retourné)');
      } else {
        console.log('⚠️ Machine toujours présente après suppression');
      }

    } else {
      console.log(`❌ Erreur création machine de test: ${createResponse.status}`);
      if (createResponse.data) {
        console.log(`   - Détails: ${JSON.stringify(createResponse.data)}`);
      }
    }

    // 4. Tester la suppression d'une machine avec données liées
    console.log('\n4. Test de suppression d\'une machine avec données liées...');
    const machinesResponse = await makeRequest('/api/machines');
    if (machinesResponse.status === 200) {
      const machines = machinesResponse.data;
      const machineWithData = machines.find(m => 
        m._count && (m._count.faults > 0 || m._count.alerts > 0 || m._count.maintenanceSchedule > 0 || m._count.maintenanceControls > 0)
      );
      
      if (machineWithData) {
        console.log(`   - Test avec machine: ${machineWithData.name}`);
        const deleteWithDataResponse = await makeRequest(`/api/machines/${machineWithData.id}`, 'DELETE');
        
        if (deleteWithDataResponse.status === 400) {
          console.log('✅ Protection fonctionne - suppression bloquée');
          console.log(`   - Message: ${deleteWithDataResponse.data.error}`);
          if (deleteWithDataResponse.data.details) {
            console.log('   - Détails des données liées:');
            Object.entries(deleteWithDataResponse.data.details).forEach(([key, value]) => {
              console.log(`     * ${key}: ${value}`);
            });
          }
        } else {
          console.log(`⚠️ Protection ne fonctionne pas: ${deleteWithDataResponse.status}`);
        }
      } else {
        console.log('⚠️ Aucune machine avec données liées trouvée pour le test');
      }
    }

    console.log('\n🎉 Test de suppression terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testMachineDeletion(); 