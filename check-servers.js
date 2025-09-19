const axios = require('axios');

async function checkServers() {
  console.log('🔍 Checking server status...\n');

  // Check backend
  try {
    const backendResponse = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('✅ Backend server is running');
    console.log('   Health status:', backendResponse.data);
  } catch (error) {
    console.log('❌ Backend server is not responding');
    console.log('   Error:', error.message);
  }

  // Check frontend
  try {
    const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Frontend server is running');
    console.log('   Status:', frontendResponse.status);
  } catch (error) {
    console.log('❌ Frontend server is not responding');
    console.log('   Error:', error.message);
  }

  console.log('\n📋 Instructions:');
  console.log('1. If backend is down: cd backend && npm start');
  console.log('2. If frontend is down: cd frontend && npm start');
  console.log('3. Make sure MongoDB is running');
  console.log('4. Check if ports 3000 and 5000 are available');
}

checkServers().catch(console.error);
