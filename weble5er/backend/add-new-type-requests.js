require('dotenv').config();
const mysql = require('mysql2/promise');

async function addNewTypeRequests() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aya_db'
        });
        
        console.log('✅ Connected to database');
        
        // Get a user ID to assign requests to (let's use user ID 3 - gheya)
        const [users] = await connection.query('SELECT id, firstname, lastname FROM users WHERE role = "user" LIMIT 1');
        const userId = users.length > 0 ? users[0].id : 3;
        
        console.log(`👤 Using user ID: ${userId} (${users[0]?.firstname} ${users[0]?.lastname})`);
        
        // Define new request types to create
        const newRequests = [
            {
                id: `req-${Date.now()}-att01`,
                type: 'Attestation de travail',
                description: 'Demande d\'attestation de travail pour démarches administratives',
                details: {
                    purpose: 'Démarches bancaires',
                    language: 'Français',
                    copies: 2,
                    comments: 'Urgent - pour prêt immobilier'
                }
            },
            {
                id: `req-${Date.now()}-doc01`,
                type: 'Document administratif',
                description: 'Demande de certificat de salaire',
                details: {
                    documentType: 'Certificat de salaire',
                    urgency: 'high',
                    additionalInfo: 'Pour dossier de location'
                }
            },
            {
                id: `req-${Date.now()}-avance01`,
                type: 'Avance sur salaire',
                description: 'Demande d\'avance sur salaire de 1500 DT',
                details: {
                    advanceAmount: 1500,
                    advanceReason: 'Urgence familiale',
                    attachments: []
                }
            },
            {
                id: `req-${Date.now()}-pret01`,
                type: 'Prêt automobile',
                description: 'Demande de prêt automobile de 25000 DT',
                details: {
                    loanType: 'car',
                    loanAmount: 25000,
                    attachments: ['contrat_vente.pdf', 'carte_grise.pdf']
                }
            },
            {
                id: `req-${Date.now()}-pret02`,
                type: 'Prêt bancaire',
                description: 'Demande de prêt personnel de 10000 DT',
                details: {
                    loanType: 'personal',
                    loanAmount: 10000,
                    attachments: ['justificatifs.pdf']
                }
            },
            {
                id: `req-${Date.now()}-autre01`,
                type: 'Autre',
                description: 'Demande de changement d\'horaire de travail',
                details: {
                    requestType: 'Changement d\'horaire',
                    reason: 'Contraintes familiales',
                    proposedSchedule: '8h-16h au lieu de 9h-17h'
                }
            }
        ];
        
        console.log(`\n📝 Creating ${newRequests.length} test requests of new types...`);
        
        for (const request of newRequests) {
            const detailsJson = JSON.stringify(request.details);
            const today = new Date().toISOString().split('T')[0];
            
            await connection.query(
                'INSERT INTO requests (id, user_id, type, status, start_date, end_date, description, details, working_days, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    request.id,
                    userId,
                    request.type,
                    'en attente',
                    today,
                    today,
                    request.description,
                    detailsJson,
                    0, // working_days = 0 for non-leave requests
                    'web'
                ]
            );
            
            console.log(`✅ Created: ${request.type} - ${request.description}`);
        }
        
        console.log('\n🎉 All new type requests created successfully!');
        
        // Verify the requests were created
        console.log('\n🔍 Verifying created requests...');
        const [allRequests] = await connection.query(
            'SELECT id, type, description, status FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [userId]
        );
        
        console.log('Recent requests:');
        allRequests.forEach(req => {
            console.log(`  - ${req.type}: ${req.description} (${req.status})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addNewTypeRequests();
