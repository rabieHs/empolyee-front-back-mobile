/**
 * Firebase Database Initialization Script
 * This script sets up the initial lock structure in Firebase Realtime Database
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://aya-lock-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function initializeDatabase() {
    try {
        console.log('🔥 Initializing Firebase Database...');
        
        // Set up the app control structure
        const appControlRef = db.ref('app_control');
        
        await appControlRef.set({
            locked: false,
            message: "Application is currently available",
            last_updated: new Date().toISOString(),
            updated_by: "system"
        });
        
        console.log('✅ Firebase Database initialized successfully!');
        console.log('📊 Database structure:');
        console.log('   app_control/');
        console.log('   ├── locked: false');
        console.log('   ├── message: "Application is currently available"');
        console.log('   ├── last_updated: ' + new Date().toISOString());
        console.log('   └── updated_by: "system"');
        
        // Test reading the data
        const snapshot = await appControlRef.once('value');
        const data = snapshot.val();
        
        console.log('\n🔍 Verification - Current database state:');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n🎉 Firebase Database setup completed successfully!');
        console.log('🔒 Lock system is now operational');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error initializing Firebase Database:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase();
