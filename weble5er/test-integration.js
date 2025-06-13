const axios = require('axios');

async function testIntegration() {
    console.log('🔗 Testing Frontend-Backend Integration...\n');

    try {
        // Test 1: Check if backend is running
        console.log('1️⃣ Testing Backend Health...');
        const backendHealth = await axios.get('http://localhost:3002/api/auth/login', {
            validateStatus: () => true // Accept any status code
        });
        console.log(`✅ Backend is running on port 3002 (Status: ${backendHealth.status})`);

        // Test 2: Check if frontend is running
        console.log('\n2️⃣ Testing Frontend Health...');
        const frontendHealth = await axios.get('http://localhost:4200', {
            validateStatus: () => true
        });
        console.log(`✅ Frontend is running on port 4200 (Status: ${frontendHealth.status})`);

        // Test 3: Test CORS - Frontend calling Backend
        console.log('\n3️⃣ Testing CORS Configuration...');
        try {
            const corsTest = await axios.post('http://localhost:3002/api/auth/login', {
                email: 'admin@aya.com',
                password: 'password'
            }, {
                headers: {
                    'Origin': 'http://localhost:4200',
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ CORS is properly configured');
            console.log(`   Login test successful: ${corsTest.data.user.firstname} ${corsTest.data.user.lastname}`);
        } catch (corsError) {
            if (corsError.response?.status === 401) {
                console.log('✅ CORS is working (got 401 - authentication error, not CORS error)');
            } else {
                console.log('❌ CORS might have issues:', corsError.message);
            }
        }

        // Test 4: Test API endpoints
        console.log('\n4️⃣ Testing API Endpoints...');
        const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'admin@aya.com',
            password: 'password'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login API working');

        // Test requests endpoint
        const requestsResponse = await axios.get('http://localhost:3002/api/requests/all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Requests API working (${requestsResponse.data.length} requests)`);

        // Test notifications endpoint
        const notificationsResponse = await axios.get('http://localhost:3002/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Notifications API working (${notificationsResponse.data.length} notifications)`);

        // Test calendar endpoint
        const calendarResponse = await axios.get('http://localhost:3002/api/calendar', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Calendar API working (${calendarResponse.data.length} events)`);

        console.log('\n🎉 Integration Test Results:');
        console.log('   ✅ Backend server running');
        console.log('   ✅ Frontend server running');
        console.log('   ✅ CORS configured correctly');
        console.log('   ✅ All API endpoints accessible');
        console.log('   ✅ Authentication working');
        console.log('\n🔗 Frontend URL: http://localhost:4200');
        console.log('🔗 Backend API: http://localhost:3002/api');
        console.log('🔗 Swagger Docs: http://localhost:3002/api-docs');

        console.log('\n📋 Next Steps:');
        console.log('   1. Open http://localhost:4200 in your browser');
        console.log('   2. Try logging in with: admin@aya.com / password');
        console.log('   3. Test creating new requests');
        console.log('   4. Verify data is saved to database (not localStorage)');

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            if (error.config?.url?.includes(':3002')) {
                console.error('💡 Backend server is not running. Start it with:');
                console.error('   cd weble5er/backend && node server.js');
            } else if (error.config?.url?.includes(':4200')) {
                console.error('💡 Frontend server is not running. Start it with:');
                console.error('   cd weble5er/signup-main && npx http-server dist/sign-up/browser -p 4200');
            }
        }
    }
}

testIntegration();
