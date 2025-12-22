/**
 * Cleanup Test Accounts
 * Removes all test accounts created for team collaboration testing
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
const auth = admin.auth();

async function cleanupTestAccounts() {
    console.log('🧹 Starting cleanup of test accounts...\n');

    // Read the test accounts file
    const accountsPath = path.join(__dirname, 'test-accounts.json');

    if (!fs.existsSync(accountsPath)) {
        console.log('❌ No test-accounts.json found. Nothing to clean up.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const { ownerUid, accounts } = data;

    let deletedAuth = 0;
    let deletedFirestore = 0;
    let deletedTeamMembers = 0;
    const errors = [];

    console.log(`📋 Found ${accounts.length} test accounts to delete\n`);

    for (const account of accounts) {
        try {
            // 1. Delete from Firebase Auth
            await auth.deleteUser(account.uid);
            deletedAuth++;
            console.log(`✅ Deleted Auth: ${account.email}`);

            // 2. Delete user document from Firestore
            await db.collection('users').doc(account.uid).delete();
            deletedFirestore++;

            // 3. Delete from team members collection
            await db.collection('teams').doc(ownerUid).collection('members').doc(account.uid).delete();
            deletedTeamMembers++;

        } catch (error) {
            console.error(`❌ Error deleting ${account.email}: ${error.message}`);
            errors.push({ email: account.email, error: error.message });
        }
    }

    // Update owner's team member count
    try {
        await db.collection('users').doc(ownerUid).update({
            'usage.teamMemberCount': admin.firestore.FieldValue.increment(-deletedTeamMembers)
        });
        console.log(`\n✅ Updated owner's team member count: -${deletedTeamMembers}`);
    } catch (error) {
        console.log(`⚠️ Could not update team member count: ${error.message}`);
    }

    // Delete the test accounts file
    fs.unlinkSync(accountsPath);
    console.log(`\n🗑️ Deleted test-accounts.json`);

    console.log('\n📊 Cleanup Summary:');
    console.log(`   Auth accounts deleted: ${deletedAuth}`);
    console.log(`   Firestore docs deleted: ${deletedFirestore}`);
    console.log(`   Team members removed: ${deletedTeamMembers}`);
    if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
    }

    console.log('\n✅ Cleanup complete!');
    process.exit(0);
}

cleanupTestAccounts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
