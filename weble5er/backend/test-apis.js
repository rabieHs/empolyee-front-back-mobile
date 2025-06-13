const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';
let authToken = '';

// Test credentials
const testCredentials = {
    admin: { email: 'admin@aya.com', password: 'password' },
    chef: { email: 'chef@aya.com', password: 'password' },
    user: { email: 'user@aya.com', password: 'password' }
};

async function testAPI() {
    console.log('🚀 Starting API Tests...\n');

    try {
        // Test 1: Login as admin
        console.log('1️⃣ Testing Admin Login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.admin);
        authToken = loginResponse.data.token;
        console.log('✅ Admin login successful');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        console.log(`   User: ${loginResponse.data.user.firstname} ${loginResponse.data.user.lastname} (${loginResponse.data.user.role})\n`);

        // Set authorization header for subsequent requests
        const authHeaders = { Authorization: `Bearer ${authToken}` };

        // Test 2: Get all users
        console.log('2️⃣ Testing Get All Users...');
        const usersResponse = await axios.get(`${BASE_URL}/users`, { headers: authHeaders });
        console.log(`✅ Retrieved ${usersResponse.data.length} users`);
        usersResponse.data.forEach(user => {
            console.log(`   - ${user.firstname} ${user.lastname} (${user.role}) - ${user.email}`);
        });
        console.log();

        // Test 3: Get all requests
        console.log('3️⃣ Testing Get All Requests...');
        const requestsResponse = await axios.get(`${BASE_URL}/requests/all`, { headers: authHeaders });
        console.log(`✅ Retrieved ${requestsResponse.data.length} requests`);
        requestsResponse.data.forEach(request => {
            console.log(`   - ${request.id}: ${request.type} (${request.status}) - ${request.firstname} ${request.lastname}`);
        });
        console.log();

        // Test 4: Get notifications
        console.log('4️⃣ Testing Get Notifications...');
        const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, { headers: authHeaders });
        console.log(`✅ Retrieved ${notificationsResponse.data.length} notifications`);
        notificationsResponse.data.forEach(notification => {
            console.log(`   - ${notification.title}: ${notification.message} (Read: ${notification.is_read})`);
        });
        console.log();

        // Test 5: Create a new request
        console.log('5️⃣ Testing Create New Request...');
        const newRequest = {
            type: 'Congé annuel',
            start_date: '2025-07-01',
            end_date: '2025-07-05',
            description: 'Test vacation request from API',
            working_days: 5,
            details: {
                reason: 'Summer vacation',
                dayPart: 'full'
            }
        };
        
        const createRequestResponse = await axios.post(`${BASE_URL}/requests`, newRequest, { headers: authHeaders });
        console.log('✅ Request created successfully');
        console.log(`   Request ID: ${createRequestResponse.data.id}`);
        console.log(`   Message: ${createRequestResponse.data.message}\n`);

        // Test 6: Test calendar events
        console.log('6️⃣ Testing Get Calendar Events...');
        const calendarResponse = await axios.get(`${BASE_URL}/calendar`, { headers: authHeaders });
        console.log(`✅ Retrieved ${calendarResponse.data.length} calendar events`);
        calendarResponse.data.forEach(event => {
            console.log(`   - ${event.title}: ${event.start} to ${event.end} (${event.status})`);
        });
        console.log();

        // Test 7: Test user login
        console.log('7️⃣ Testing User Login...');
        const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.user);
        console.log('✅ User login successful');
        console.log(`   User: ${userLoginResponse.data.user.firstname} ${userLoginResponse.data.user.lastname} (${userLoginResponse.data.user.role})\n`);

        // Test 8: Test chef login
        console.log('8️⃣ Testing Chef Login...');
        const chefLoginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.chef);
        console.log('✅ Chef login successful');
        console.log(`   Chef: ${chefLoginResponse.data.user.firstname} ${chefLoginResponse.data.user.lastname} (${chefLoginResponse.data.user.role})\n`);

        console.log('🎉 All API tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Authentication working');
        console.log('   ✅ User management working');
        console.log('   ✅ Request management working');
        console.log('   ✅ Notifications working');
        console.log('   ✅ Calendar integration working');
        console.log('\n🔗 Swagger Documentation: http://localhost:3002/api-docs');

    } catch (error) {
        console.error('❌ API Test Failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.message || error.response.data}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Make sure the backend server is running on port 3002');
            console.error('   Run: cd weble5er/backend && node server.js');
        }
    }
}

// Run the tests
testAPI();
