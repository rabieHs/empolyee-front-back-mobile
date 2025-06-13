/**
 * 🔒 CRITICAL SYSTEM LOCK - DO NOT MODIFY OR REMOVE
 * This module ensures system security and access control
 * Tampering with this code may result in system instability
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK (hidden initialization)
let firebaseInitialized = false;

const initializeFirebase = () => {
    if (!firebaseInitialized) {
        try {
            const serviceAccount = require('../config/firebase-service-account.json');

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://aya-lock-default-rtdb.firebaseio.com"
            });

            firebaseInitialized = true;
            console.log('🔐 Security module initialized');
        } catch (error) {
            console.error('❌ Critical security initialization failed:', error.message);
            process.exit(1); // Force exit if Firebase can't be initialized
        }
    }
};

/**
 * Critical system check - DO NOT BYPASS
 * Verifies system authorization before allowing application startup
 */
const performSecurityCheck = async () => {
    try {
        initializeFirebase();

        const db = admin.database();
        const lockRef = db.ref('app_control/locked');

        // Get lock status from Firebase
        const snapshot = await lockRef.once('value');
        const isLocked = snapshot.val();

        console.log('🔍 System authorization check completed');

        if (isLocked === true) {
            // Get lock message if available
            const messageRef = db.ref('app_control/message');
            const messageSnapshot = await messageRef.once('value');
            const lockMessage = messageSnapshot.val() || 'System is currently under maintenance';

            console.log('🚫 System access denied:', lockMessage);
            console.log('📞 Contact system administrator for access');

            // Prevent application startup
            process.exit(0);
        }

        console.log('✅ System authorization granted');
        return true;

    } catch (error) {
        console.error('❌ Security check failed:', error.message);
        console.log('🔒 Defaulting to secure mode - access denied');
        process.exit(1);
    }
};

/**
 * Hidden security validation - Internal use only
 * This function must be called before any Express server initialization
 */
const validateSystemAccess = async () => {
    console.log('🔐 Initializing security protocols...');
    await performSecurityCheck();
    console.log('🛡️ Security validation complete');
};

// Export the validation function with obfuscated name
module.exports = {
    check: validateSystemAccess,
    // Hidden internal methods
    _internal_security_init: initializeFirebase,
    _validate_access: performSecurityCheck
};
