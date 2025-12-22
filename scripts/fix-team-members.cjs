/**
 * Fix Team Members - Migrate members to correct Firestore path
 * App reads from: users/{userId}/team
 * Script wrote to: teams/{ownerUid}/members
 * This script copies data to the correct location
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    const serviceAccount = require('../responceai-firebase-adminsdk-fbsvc-1cd4fb2148.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://responceai.firebaseio.com'
    });
}

const db = admin.firestore();

async function fixTeamMembers() {
    console.log('🔧 Fixing team members Firestore paths...\n');

    // Read the test accounts file
    const accountsPath = path.join(__dirname, 'test-accounts.json');

    if (!fs.existsSync(accountsPath)) {
        console.log('❌ No test-accounts.json found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const { ownerUid, accounts } = data;

    console.log(`📋 Found ${accounts.length} accounts to fix\n`);
    console.log(`Owner UID: ${ownerUid}\n`);

    let fixed = 0;
    const errors = [];

    for (const account of accounts) {
        try {
            // Add to correct path: users/{ownerUid}/team/{email}
            // The app uses email as document ID (see inviteTeamMember function)
            const email = account.email.toLowerCase();

            await db.collection('users').doc(ownerUid).collection('team').doc(email).set({
                email: email,
                role: account.role,
                status: 'active',
                invitedAt: admin.firestore.FieldValue.serverTimestamp(),
                acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
                invitedBy: ownerUid,
                isTestAccount: true
            });

            fixed++;
            console.log(`✅ Fixed: ${email} (${account.role})`);

        } catch (error) {
            console.error(`❌ Error fixing ${account.email}: ${error.message}`);
            errors.push({ email: account.email, error: error.message });
        }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   Fixed: ${fixed} accounts`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
}

fixTeamMembers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
