/**
 * Firebase Lock Control Script
 * Use this script to lock/unlock the application remotely
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

async function toggleLock() {
    try {
        console.log('🔥 Connecting to Firebase...');
        
        const appControlRef = db.ref('app_control');
        
        // Get current lock status
        const snapshot = await appControlRef.child('locked').once('value');
        const currentStatus = snapshot.val() || false;
        
        // Toggle the status
        const newStatus = !currentStatus;
        const newMessage = newStatus 
            ? "Application is temporarily locked for maintenance. Please try again later."
            : "Application is now available for use.";
        
        // Update the database
        await appControlRef.update({
            locked: newStatus,
            message: newMessage,
            last_updated: new Date().toISOString(),
            updated_by: "admin_script"
        });
        
        console.log(`\n🔄 Lock status changed:`);
        console.log(`   Previous: ${currentStatus ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
        console.log(`   Current:  ${newStatus ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
        console.log(`   Message:  "${newMessage}"`);
        console.log(`   Updated:  ${new Date().toISOString()}`);
        
        if (newStatus) {
            console.log('\n⚠️  APPLICATION IS NOW LOCKED');
            console.log('   - Backend server will block new connections');
            console.log('   - Mobile app will show lock screen');
            console.log('   - Users cannot access the application');
        } else {
            console.log('\n✅ APPLICATION IS NOW UNLOCKED');
            console.log('   - Backend server is accepting connections');
            console.log('   - Mobile app is fully functional');
            console.log('   - Users can access the application normally');
        }
        
        console.log('\n🎉 Lock status updated successfully!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error toggling lock status:', error);
        process.exit(1);
    }
}

async function showStatus() {
    try {
        console.log('🔥 Checking current lock status...');
        
        const appControlRef = db.ref('app_control');
        const snapshot = await appControlRef.once('value');
        const data = snapshot.val();
        
        if (data) {
            console.log('\n📊 Current Application Status:');
            console.log(`   Status:      ${data.locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
            console.log(`   Message:     "${data.message}"`);
            console.log(`   Last Update: ${data.last_updated}`);
            console.log(`   Updated By:  ${data.updated_by}`);
        } else {
            console.log('\n⚠️  No lock data found in database');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error checking lock status:', error);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'status' || command === 'check') {
    showStatus();
} else if (command === 'toggle' || !command) {
    toggleLock();
} else {
    console.log('🔧 Firebase Lock Control Script');
    console.log('\nUsage:');
    console.log('  node toggleLock.js          - Toggle lock status');
    console.log('  node toggleLock.js toggle    - Toggle lock status');
    console.log('  node toggleLock.js status    - Show current status');
    console.log('  node toggleLock.js check     - Show current status');
    process.exit(0);
}
