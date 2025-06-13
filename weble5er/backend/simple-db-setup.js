require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    
    try {
        // Connect to MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        
        console.log('✅ Connected to MySQL server');
        
        // Create database
        await connection.query('CREATE DATABASE IF NOT EXISTS aya_db');
        console.log('✅ Database aya_db created');
        
        // Use the database
        await connection.query('USE aya_db');
        console.log('✅ Using aya_db database');
        
        // Create departments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created departments table');
        
        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                firstname VARCHAR(100) NOT NULL,
                lastname VARCHAR(100) NOT NULL,
                role ENUM('user', 'chef', 'admin') DEFAULT 'user',
                department_id INT,
                chef_id INT NULL,
                profile_image VARCHAR(255),
                fcm_token VARCHAR(255),
                device_type ENUM('web', 'mobile', 'both') DEFAULT 'web',
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id),
                FOREIGN KEY (chef_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Created users table');
        
        // Insert sample departments
        await connection.query(`
            INSERT IGNORE INTO departments (name, description) VALUES
            ('Ressources Humaines', 'Gestion du personnel et des ressources humaines'),
            ('Développement', 'Développement logiciel et applications'),
            ('Management', 'Direction et gestion des équipes'),
            ('Marketing', 'Marketing et communication'),
            ('Finance', 'Gestion financière et comptabilité')
        `);
        console.log('✅ Inserted sample departments');
        
        // Insert sample users
        await connection.query(`
            INSERT IGNORE INTO users (email, password, firstname, lastname, role, department_id) VALUES
            ('admin@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'Admin', 'RH', 'admin', 1),
            ('chef@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'Chef', 'Service', 'chef', 3),
            ('user@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'User', 'Test', 'user', 2)
        `);
        console.log('✅ Inserted sample users');
        
        // Update chef_id for user
        await connection.query(`UPDATE users SET chef_id = 2 WHERE email = 'user@aya.com'`);
        
        // Show created users
        const [users] = await connection.query('SELECT id, email, firstname, lastname, role FROM users');
        console.log('\n👥 Created users:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ${user.firstname} ${user.lastname}`);
        });
        
        console.log('\n🎉 Basic database setup completed successfully!');
        console.log('📝 You can now run the backend server to test the connection.');
        
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

setupDatabase();
