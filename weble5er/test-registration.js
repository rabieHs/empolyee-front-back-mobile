const axios = require('axios');

async function testRegistration() {
    console.log('🧪 Testing Registration API...\n');

    try {
        // Test registration with new user data
        const userData = {
            firstname: 'Test',
            lastname: 'User',
            email: 'newuser' + Date.now() + '@example.com',
            password: 'password123'
        };

        console.log('📝 Attempting to register user:', userData);

        const response = await axios.post('http://localhost:3002/api/auth/register', userData);

        console.log('✅ Registration successful!');
        console.log('Response:', response.data);

        // Test login with the new user
        console.log('\n🔐 Testing login with new user...');
        const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
            email: userData.email,
            password: userData.password
        });

        console.log('✅ Login successful!');
        console.log('User:', loginResponse.data.user);

        // Check if user exists in database
        console.log('\n📊 Checking database...');
        const token = loginResponse.data.token;
        const usersResponse = await axios.get('http://localhost:3002/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const newUser = usersResponse.data.find(u => u.email === userData.email);
        if (newUser) {
            console.log('✅ User found in database:', newUser);
        } else {
            console.log('❌ User not found in database');
        }

    } catch (error) {
        console.error('❌ Registration test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRegistration();
