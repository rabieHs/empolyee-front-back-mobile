const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testCalendar() {
    try {
        // Create a token for admin user
        const token = jwt.sign(
            { userId: 1, email: 'admin@aya.com', role: 'admin' },
            'aya_secret_jwt_token_2025'
        );
        
        console.log('🔑 Generated token:', token.substring(0, 20) + '...');
        
        // Test calendar endpoint
        const response = await axios.get('http://localhost:3002/api/calendar', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Calendar response:', response.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n🔍 Testing if calendar route exists...');
            try {
                const testResponse = await axios.get('http://localhost:3002/api/calendar/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('✅ /api/calendar/user works:', testResponse.data);
            } catch (userError) {
                console.error('❌ /api/calendar/user also fails:', userError.response?.status, userError.response?.data || userError.message);
            }
        }
    }
}

testCalendar();
