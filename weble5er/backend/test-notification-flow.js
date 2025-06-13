const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testNotificationFlow() {
    try {
        console.log('🧪 Testing notification flow...\n');
        
        // Create tokens for different users
        const adminToken = jwt.sign(
            { userId: 1, email: 'admin@aya.com', role: 'admin' },
            'aya_secret_jwt_token_2025'
        );
        
        const chefToken = jwt.sign(
            { userId: 2, email: 'chef@aya.com', role: 'chef' },
            'aya_secret_jwt_token_2025'
        );
        
        const userToken = jwt.sign(
            { userId: 3, email: 'user@aya.com', role: 'user' },
            'aya_secret_jwt_token_2025'
        );
        
        // Step 1: Get a request to update
        console.log('📋 Step 1: Getting requests...');
        const requestsResponse = await axios.get('http://localhost:3002/api/requests', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const requests = requestsResponse.data;
        console.log(`Found ${requests.length} requests`);
        
        if (requests.length === 0) {
            console.log('❌ No requests found to test with');
            return;
        }
        
        // Find a pending request
        const pendingRequest = requests.find(r => r.status === 'en attente');
        if (!pendingRequest) {
            console.log('❌ No pending requests found');
            return;
        }
        
        console.log(`✅ Found pending request: ${pendingRequest.id} (${pendingRequest.type})`);
        console.log(`   User: ${pendingRequest.firstname} ${pendingRequest.lastname} (ID: ${pendingRequest.user_id})`);
        
        // Step 2: Check notifications before update
        console.log('\n📧 Step 2: Checking notifications before update...');
        
        // Check user notifications
        const userNotificationsBefore = await axios.get('http://localhost:3002/api/notifications', {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        console.log(`User has ${userNotificationsBefore.data.length} notifications before update`);
        
        // Step 3: Admin approves the request
        console.log('\n✅ Step 3: Admin approving request...');
        const updateResponse = await axios.put(`http://localhost:3002/api/requests/${pendingRequest.id}`, {
            status: 'Approuvée',
            admin_response: 'Test approval by admin'
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        console.log('✅ Request updated successfully:', updateResponse.data.status);
        
        // Step 4: Check notifications after update
        console.log('\n📧 Step 4: Checking notifications after update...');
        
        // Wait a moment for notifications to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check user notifications
        const userNotificationsAfter = await axios.get('http://localhost:3002/api/notifications', {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        console.log(`User has ${userNotificationsAfter.data.length} notifications after update`);
        
        if (userNotificationsAfter.data.length > userNotificationsBefore.data.length) {
            console.log('✅ New notification created for user!');
            const newNotifications = userNotificationsAfter.data.slice(0, userNotificationsAfter.data.length - userNotificationsBefore.data.length);
            newNotifications.forEach(notif => {
                console.log(`   📧 ${notif.title}: ${notif.message}`);
            });
        } else {
            console.log('❌ No new notifications created for user');
        }
        
        // Check admin notifications
        const adminNotifications = await axios.get('http://localhost:3002/api/notifications', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`Admin has ${adminNotifications.data.length} total notifications`);
        
        // Check chef notifications
        const chefNotifications = await axios.get('http://localhost:3002/api/notifications', {
            headers: { 'Authorization': `Bearer ${chefToken}` }
        });
        console.log(`Chef has ${chefNotifications.data.length} total notifications`);
        
        console.log('\n🎯 Test completed!');
        
    } catch (error) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

testNotificationFlow();
