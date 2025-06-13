const mysql = require('mysql2/promise');

// Configuration de la connexion MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aya_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function updateSalimRole() {
    try {
        console.log('Connecting to database...');

        // Check if salim@gmail.com exists
        const [users] = await pool.execute(
            'SELECT id, email, firstname, lastname, role FROM users WHERE email = ?',
            ['salim@gmail.com']
        );

        if (users.length === 0) {
            console.log('User salim@gmail.com not found');
            return;
        }

        const user = users[0];
        console.log('Found user:', user);

        if (user.role === 'chef') {
            console.log('User is already a chef');
            return;
        }

        // Update role to chef
        const [result] = await pool.execute(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
            ['chef', 'salim@gmail.com']
        );

        if (result.affectedRows > 0) {
            console.log('✅ Successfully updated salim@gmail.com role to chef');

            // Verify the update
            const [updatedUsers] = await pool.execute(
                'SELECT id, email, firstname, lastname, role FROM users WHERE email = ?',
                ['salim@gmail.com']
            );

            console.log('Updated user:', updatedUsers[0]);
        } else {
            console.log('❌ Failed to update user role');
        }

    } catch (error) {
        console.error('Error updating user role:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed');
    }
}

// Run the update
updateSalimRole();
