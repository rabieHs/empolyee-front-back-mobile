require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRequestsTable() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aya_db'
        });
        
        console.log('✅ Connected to database');
        
        // Check requests table structure
        console.log('\n📋 Requests table structure:');
        const [columns] = await connection.query('DESCRIBE requests');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
            if (col.Field === 'status') {
                console.log(`    Default: ${col.Default}, Extra: ${col.Extra}`);
            }
        });
        
        // Check current status values
        console.log('\n📊 Current status values in requests:');
        const [statusValues] = await connection.query('SELECT DISTINCT status FROM requests');
        statusValues.forEach(row => {
            console.log(`  - "${row.status}"`);
        });
        
        // Check if status is an ENUM
        const [tableInfo] = await connection.query('SHOW CREATE TABLE requests');
        console.log('\n🔍 Table creation SQL:');
        console.log(tableInfo[0]['Create Table']);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkRequestsTable();
