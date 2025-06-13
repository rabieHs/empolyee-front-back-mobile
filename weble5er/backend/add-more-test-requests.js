require('dotenv').config();
const mysql = require('mysql2/promise');

async function addMoreTestRequests() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aya_db'
        });
        
        console.log('✅ Connected to database');
        
        // Get different users
        const [users] = await connection.query('SELECT id, firstname, lastname FROM users WHERE role = "user"');
        console.log(`👥 Found ${users.length} users`);
        
        // Create requests with different statuses to show color coding
        const testRequests = [
            {
                id: `req-${Date.now()}-att02`,
                userId: users[0]?.id || 3,
                type: 'Attestation de travail',
                status: 'Chef approuvé',
                description: 'Attestation de travail pour visa',
                details: { purpose: 'Visa', language: 'Français', copies: 1 }
            },
            {
                id: `req-${Date.now()}-doc02`,
                userId: users[1]?.id || 3,
                type: 'Document administratif',
                status: 'Approuvée',
                description: 'Certificat de travail',
                details: { documentType: 'Certificat de travail', urgency: 'medium' }
            },
            {
                id: `req-${Date.now()}-avance02`,
                userId: users[0]?.id || 3,
                type: 'Avance sur salaire',
                status: 'Chef rejeté',
                description: 'Avance de 2000 DT',
                details: { advanceAmount: 2000, advanceReason: 'Achat voiture' }
            },
            {
                id: `req-${Date.now()}-pret03`,
                userId: users[1]?.id || 3,
                type: 'Prêt automobile',
                status: 'Rejetée',
                description: 'Prêt auto 30000 DT',
                details: { loanType: 'car', loanAmount: 30000 }
            },
            {
                id: `req-${Date.now()}-autre02`,
                userId: users[0]?.id || 3,
                type: 'Autre',
                status: 'Approuvée',
                description: 'Demande de télétravail',
                details: { requestType: 'Télétravail', reason: 'Optimisation productivité' }
            }
        ];
        
        console.log(`\n📝 Creating ${testRequests.length} more test requests with different statuses...`);
        
        for (const request of testRequests) {
            const detailsJson = JSON.stringify(request.details);
            const today = new Date().toISOString().split('T')[0];
            
            await connection.query(
                'INSERT INTO requests (id, user_id, type, status, start_date, end_date, description, details, working_days, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    request.id,
                    request.userId,
                    request.type,
                    request.status,
                    today,
                    today,
                    request.description,
                    detailsJson,
                    0,
                    'web'
                ]
            );
            
            console.log(`✅ Created: ${request.type} (${request.status}) - ${request.description}`);
        }
        
        console.log('\n🎉 Additional test requests created successfully!');
        
        // Show summary of all request types
        console.log('\n📊 Summary of all request types in database:');
        const [summary] = await connection.query(
            'SELECT type, status, COUNT(*) as count FROM requests GROUP BY type, status ORDER BY type, status'
        );
        
        summary.forEach(row => {
            console.log(`  - ${row.type} (${row.status}): ${row.count} requests`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addMoreTestRequests();
