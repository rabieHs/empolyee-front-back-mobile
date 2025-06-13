const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testNotifications() {
    try {
        // Create a token for admin user
        const token = jwt.sign(
            { userId: 1, email: 'admin@aya.com', role: 'admin' },
            'aya_secret_jwt_token_2025'
        );
        
        console.log('🔑 Generated token:', token.substring(0, 20) + '...');
        
        // Test notifications endpoint
        const response = await axios.get('http://localhost:3002/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Notifications response:', response.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testNotifications();
