require('dotenv').config();
const mysql = require('mysql2/promise');

async function completeSetup() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'aya_db'
        });
        
        console.log('✅ Connected to aya_db database');
        
        // Create personal_info table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS personal_info (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                cin VARCHAR(20) NOT NULL,
                date_of_birth DATE NOT NULL,
                place_of_birth VARCHAR(100),
                nationality VARCHAR(50) NOT NULL,
                marital_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT 'single',
                number_of_children INT DEFAULT 0,
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                phone VARCHAR(20),
                emergency_contact_name VARCHAR(100),
                emergency_contact_relationship VARCHAR(50),
                emergency_contact_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created personal_info table');
        
        // Create professional_info table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS professional_info (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                employee_id VARCHAR(50) NOT NULL,
                position VARCHAR(100) NOT NULL,
                grade VARCHAR(50),
                hire_date DATE NOT NULL,
                contract_type ENUM('CDI', 'CDD', 'ANAPEC', 'Stage') DEFAULT 'CDI',
                salary DECIMAL(10, 2),
                rib VARCHAR(50),
                bank_name VARCHAR(100),
                cnss VARCHAR(50),
                mutuelle VARCHAR(50),
                annual_leave_balance INT DEFAULT 30,
                sick_leave_balance INT DEFAULT 15,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created professional_info table');
        
        // Create password_reset_tokens table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created password_reset_tokens table');
        
        // Create requests table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS requests (
                id VARCHAR(50) PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('Congé annuel', 'Congé maladie', 'Congé maternité', 'Formation', 'Congé', 'Document', 'Attestation de travail', 'Document administratif', 'Prêt automobile', 'Prêt bancaire', 'Avance sur salaire', 'Autre') NOT NULL,
                status ENUM('en attente', 'Chef approuvé', 'Chef rejeté', 'Approuvée', 'Rejetée') DEFAULT 'en attente',
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                description TEXT,
                details JSON,
                chef_observation TEXT,
                admin_response TEXT,
                working_days INT NOT NULL,
                source ENUM('web', 'mobile') DEFAULT 'web',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created requests table');
        
        // Create request_history table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS request_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id VARCHAR(50) NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(50) NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created request_history table');
        
        // Create request_attachments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS request_attachments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                file_size INT,
                uploaded_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created request_attachments table');
        
        // Create request_comments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS request_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id VARCHAR(50) NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created request_comments table');
        
        // Create notifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                reference_id VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                platform ENUM('web', 'mobile', 'both') DEFAULT 'both',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created notifications table');
        
        // Create calendar_events table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                all_day BOOLEAN DEFAULT FALSE,
                type VARCHAR(50) DEFAULT 'event',
                color VARCHAR(20),
                is_public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created calendar_events table');
        
        // Insert sample data
        await connection.query(`
            INSERT IGNORE INTO personal_info (user_id, cin, date_of_birth, place_of_birth, nationality, marital_status, number_of_children, address, city, country, phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone) VALUES
            (1, 'AB123456', '1990-01-01', 'Tunis', 'Tunisienne', 'single', 0, '1 Rue de l\\'Administration', 'Tunis', 'Tunisie', '0600000000', 'Contact Urgence', 'Famille', '0600000001'),
            (2, 'CD789012', '1985-01-01', 'Tunis', 'Tunisienne', 'married', 2, '123 Rue des Chefs', 'Tunis', 'Tunisie', '0600000000', 'Contact Urgence', 'Famille', '0600000001'),
            (3, '12345678', '1995-05-15', 'Tunis', 'Tunisienne', 'single', 0, '123 Rue Principale', 'Tunis', 'Tunisie', '+216 55 123 456', 'Contact Urgence', 'Famille', '+216 55 789 012')
        `);
        console.log('✅ Inserted personal_info data');
        
        await connection.query(`
            INSERT IGNORE INTO professional_info (user_id, employee_id, position, grade, hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle) VALUES
            (1, 'ADM001', 'Responsable RH', 'Cadre', '2024-01-01', 'CDI', 50000.00, 'TN5930001007941234567890185', 'Banque Nationale', 'CNSS123456', 'MUT789012'),
            (2, 'CHEF001', 'Chef d\\'équipe', 'Senior', '2020-01-01', 'CDI', 35000.00, 'TN5930001007941234567890186', 'Banque Nationale', 'CNSS789012', 'MUT123456'),
            (3, 'EMP001', 'Développeur Web', 'Junior', '2023-01-15', 'CDI', 30000.00, 'TN5930001007941234567890185', 'Banque Nationale de Tunisie', 'CNSS123456', 'MUT789012')
        `);
        console.log('✅ Inserted professional_info data');
        
        // Insert sample requests
        await connection.query(`
            INSERT IGNORE INTO requests (id, user_id, type, status, start_date, end_date, description, details, working_days) VALUES
            ('req-test-001', 3, 'Congé annuel', 'Approuvée', '2025-06-01', '2025-06-07', 'Congé annuel de test', '{"reason": "Vacances"}', 7),
            ('req-test-002', 3, 'Formation', 'en attente', '2025-07-15', '2025-07-20', 'Formation Angular', '{"title": "Formation Angular"}', 5)
        `);
        console.log('✅ Inserted sample requests');
        
        // Show all tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📋 All tables created:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        
        console.log('\n🎉 Complete database setup finished successfully!');
        console.log('📝 Database aya_db is ready with all tables and sample data.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

completeSetup();
