require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aya_db'
        });
        
        console.log('✅ Connected to database');
        
        // Get all users
        const [users] = await connection.query('SELECT id, email, firstname, lastname, role, password FROM users');
        
        console.log('\n👥 Users in database:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ${user.firstname} ${user.lastname}`);
            console.log(`    Password hash: ${user.password.substring(0, 20)}...`);
        });
        
        // Test password verification
        console.log('\n🔐 Testing password verification:');
        for (const user of users) {
            const testPassword = 'password';
            const isValid = await bcrypt.compare(testPassword, user.password);
            console.log(`  - ${user.email}: password="${testPassword}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }
        
        // Create new password hash for testing
        console.log('\n🔑 Creating new password hash for "password":');
        const newHash = await bcrypt.hash('password', 10);
        console.log(`  New hash: ${newHash}`);
        
        // Update all users with the new password hash
        console.log('\n🔄 Updating all users with new password hash...');
        await connection.query('UPDATE users SET password = ?', [newHash]);
        console.log('✅ All users updated with new password hash');
        
        console.log('\n✅ All users can now login with password: "password"');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsers();
