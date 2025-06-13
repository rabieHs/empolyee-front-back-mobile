const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugRequestUpdate() {
    try {
        console.log('🔍 Debugging request update process...\n');
        
        // Create admin token
        const adminToken = jwt.sign(
            { userId: 1, email: 'admin@aya.com', role: 'admin' },
            'aya_secret_jwt_token_2025'
        );
        
        // Get a pending request
        const requestsResponse = await axios.get('http://localhost:3002/api/requests', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const pendingRequest = requestsResponse.data.find(r => r.status === 'en attente');
        if (!pendingRequest) {
            console.log('❌ No pending requests found');
            return;
        }
        
        console.log('📋 Request to update:', {
            id: pendingRequest.id,
            type: pendingRequest.type,
            status: pendingRequest.status,
            user_id: pendingRequest.user_id,
            firstname: pendingRequest.firstname,
            lastname: pendingRequest.lastname
        });
        
        // Test the PATCH endpoint (used by frontend)
        console.log('\n🔧 Testing PATCH /api/requests/:id/status endpoint...');
        try {
            const patchResponse = await axios.patch(`http://localhost:3002/api/requests/${pendingRequest.id}/status`, {
                status: 'Approuvée',
                observation: 'Test approval via PATCH'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            console.log('✅ PATCH response:', patchResponse.data);
        } catch (error) {
            console.error('❌ PATCH error:', error.response?.data || error.message);
        }
        
        // Wait and check notifications
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if notification was created
        const userToken = jwt.sign(
            { userId: pendingRequest.user_id, email: 'user@aya.com', role: 'user' },
            'aya_secret_jwt_token_2025'
        );
        
        const userNotifications = await axios.get('http://localhost:3002/api/notifications', {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        console.log(`\n📧 User notifications after PATCH: ${userNotifications.data.length}`);
        if (userNotifications.data.length > 0) {
            userNotifications.data.forEach(notif => {
                console.log(`   📧 ${notif.title}: ${notif.message} (${notif.created_at})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error during debug:', error.response?.data || error.message);
    }
}

debugRequestUpdate();
