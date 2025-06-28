async function testAlertsAPI() {
  console.log('🧪 Testing Alerts API\n');

  const baseUrl = 'http://localhost:3001'; // Ajuste selon ton port

  const testCases = [
    { name: 'All alerts', url: '/api/alerts' },
    { name: 'Active alerts', url: '/api/alerts?status=active' },
    { name: 'Technician alerts', url: '/api/alerts?status=active&role=technician' },
    { name: 'Admin alerts', url: '/api/alerts?status=active&role=admin' },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`URL: ${baseUrl}${testCase.url}`);
      
      const response = await fetch(`${baseUrl}${testCase.url}`);
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.length} alerts found`);
        if (data.length > 0) {
          console.log(`   Sample alert:`, {
            id: data[0].id,
            message: data[0].message,
            type: data[0].type,
            status: data[0].status,
            machineId: data[0].machineId
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
      
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Network error: ${error.message}\n`);
    }
  }
}

// Exécuter le test
testAlertsAPI(); 