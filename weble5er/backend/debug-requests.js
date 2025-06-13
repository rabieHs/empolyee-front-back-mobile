require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugRequests() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aya_db'
        });
        
        console.log('✅ Connected to database');
        
        // Test the exact query from the requests route
        console.log('\n🔍 Testing requests query...');
        const [requests] = await connection.query(`
            SELECT r.*,
                   u.firstname,
                   u.lastname,
                   u.email,
                   d.name as department_name,
                   pi.cin,
                   pi.phone,
                   pri.position
            FROM requests r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN personal_info pi ON u.id = pi.user_id
            LEFT JOIN professional_info pri ON u.id = pri.user_id
            ORDER BY r.created_at DESC
        `);
        
        console.log(`✅ Query successful! Found ${requests.length} requests:`);
        requests.forEach(request => {
            console.log(`  - ${request.id}: ${request.type} (${request.status}) - ${request.firstname} ${request.lastname}`);
        });
        
        // Check table structure
        console.log('\n📋 Checking table structures...');
        
        const [requestsColumns] = await connection.query('DESCRIBE requests');
        console.log('\nRequests table columns:');
        requestsColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        const [usersColumns] = await connection.query('DESCRIBE users');
        console.log('\nUsers table columns:');
        usersColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugRequests();
