const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testChefNotifications() {
    try {
        console.log('🧪 Testing chef notification flow...\n');
        
        // Create tokens for different users
        const chefToken = jwt.sign(
            { userId: 2, email: 'chef@aya.com', role: 'chef' },
            'aya_secret_jwt_token_2025'
        );
        
        const userToken = jwt.sign(
            { userId: 3, email: 'user@aya.com', role: 'user' },
            'aya_secret_jwt_token_2025'
        );
        
        // Step 1: Get a congé or formation request to update
        console.log('📋 Step 1: Getting congé/formation requests...');
        const requestsResponse = await axios.get('http://localhost:3002/api/requests', {
            headers: { 'Authorization': `Bearer ${chefToken}` }
        });
        
        const requests = requestsResponse.data;
        console.log(`Found ${requests.length} total requests`);
        
        // Find a pending congé or formation request
        const pendingRequest = requests.find(r => 
            r.status === 'en attente' && 
            (r.type.toLowerCase().includes('congé') || r.type.toLowerCase().includes('formation'))
        );
        
        if (!pendingRequest) {
            console.log('❌ No pending congé/formation requests found');
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
        
        // Step 3: Chef approves the request
        console.log('\n✅ Step 3: Chef approving request...');
        const updateResponse = await axios.put(`http://localhost:3002/api/requests/${pendingRequest.id}`, {
            status: 'Chef approuvé',
            chef_observation: 'Test approval by chef'
        }, {
            headers: { 'Authorization': `Bearer ${chefToken}` }
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
        
        console.log('\n🎯 Chef notification test completed!');
        
    } catch (error) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

testChefNotifications();
