require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    let connection;

    try {
        // Connect to MySQL without specifying a database first
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Connected to MySQL server');

        // Read the SQL setup file
        const sqlFilePath = path.join(__dirname, 'database', 'aya_db_setup.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing database setup script...');

        // Split the SQL script into individual statements
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement individually
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.log(`Warning: ${error.message}`);
                    }
                }
            }
        }

        console.log('✅ Database aya_db has been created successfully!');
        console.log('✅ All tables have been created with the new schema');
        console.log('✅ Sample data has been inserted');

        // Test the connection to the new database
        await connection.query('USE aya_db');
        const [tables] = await connection.query('SHOW TABLES');

        console.log('\n📋 Created tables:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });

        // Show sample users
        const [users] = await connection.query('SELECT id, email, firstname, lastname, role FROM users');
        console.log('\n👥 Sample users created:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ${user.firstname} ${user.lastname}`);
        });

    } catch (error) {
        console.error('❌ Error setting up database:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure XAMPP MySQL is running!');
            console.log('   - Start XAMPP Control Panel');
            console.log('   - Click "Start" next to MySQL');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the setup
setupDatabase();
