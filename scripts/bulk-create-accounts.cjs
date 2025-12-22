/**
 * Bulk Create Test Accounts for Team Collaboration Testing
 * Creates 30 test accounts using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require('../responceai-firebase-adminsdk-fbsvc-1cd4fb2148.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://responceai.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();

// Configuration
const NUM_ACCOUNTS = 30;
const TEAM_OWNER_UID = null; // Will be fetched from owner email
const TEAM_OWNER_EMAIL = 'sujithkallutla@gmail.com';

// Role distribution: 60% viewer, 30% editor, 10% admin
function getRole(index) {
    if (index < 3) return 'admin';      // 3 admins (10%)
    if (index < 12) return 'editor';    // 9 editors (30%)
    return 'viewer';                     // 18 viewers (60%)
}

async function getOwnerUid() {
    try {
        const user = await auth.getUserByEmail(TEAM_OWNER_EMAIL);
        console.log(`✅ Found owner: ${TEAM_OWNER_EMAIL} (${user.uid})`);
        return user.uid;
    } catch (error) {
        console.error(`❌ Could not find owner account: ${TEAM_OWNER_EMAIL}`);
        throw error;
    }
}

async function createTestAccounts() {
    console.log('🚀 Starting bulk account creation...\n');

    const ownerUid = await getOwnerUid();
    const accounts = [];
    const errors = [];

    for (let i = 1; i <= NUM_ACCOUNTS; i++) {
        const email = `testuser${i}@rfpgrep.test`;
        const password = `TestPass${i}!2024`;
        const displayName = `Test User ${i}`;
        const role = getRole(i);

        try {
            // Create user in Firebase Auth
            const userRecord = await auth.createUser({
                email: email,
                password: password,
                displayName: displayName,
                emailVerified: true // Skip email verification
            });

            console.log(`✅ Created account ${i}/${NUM_ACCOUNTS}: ${email} (${role})`);

            // Create user document in Firestore
            await db.collection('users').doc(userRecord.uid).set({
                email: email,
                displayName: displayName,
                plan: 'free',
                teamId: ownerUid, // Join owner's team
                role: role,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isTestAccount: true
            });

            // Add to team members collection
            await db.collection('teams').doc(ownerUid).collection('members').doc(userRecord.uid).set({
                email: email,
                role: role,
                status: 'active',
                invitedAt: admin.firestore.FieldValue.serverTimestamp(),
                acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
                isTestAccount: true
            });

            accounts.push({
                uid: userRecord.uid,
                email: email,
                password: password,
                displayName: displayName,
                role: role
            });

        } catch (error) {
            console.error(`❌ Failed to create account ${i}: ${error.message}`);
            errors.push({ index: i, email: email, error: error.message });
        }
    }

    // Update owner's usage count
    try {
        await db.collection('users').doc(ownerUid).update({
            'usage.teamMemberCount': admin.firestore.FieldValue.increment(accounts.length)
        });
        console.log(`\n✅ Updated owner's team member count: +${accounts.length}`);
    } catch (error) {
        console.log(`⚠️ Could not update team member count: ${error.message}`);
    }

    // Save accounts to file
    const outputPath = path.join(__dirname, 'test-accounts.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        ownerUid: ownerUid,
        ownerEmail: TEAM_OWNER_EMAIL,
        createdAt: new Date().toISOString(),
        totalAccounts: accounts.length,
        accounts: accounts,
        errors: errors
    }, null, 2));

    console.log(`\n📄 Saved account details to: ${outputPath}`);
    console.log(`\n✅ Successfully created ${accounts.length}/${NUM_ACCOUNTS} accounts`);
    if (errors.length > 0) {
        console.log(`❌ Failed: ${errors.length} accounts`);
    }

    // Summary by role
    const roleCount = accounts.reduce((acc, a) => {
        acc[a.role] = (acc[a.role] || 0) + 1;
        return acc;
    }, {});
    console.log('\n📊 Role distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} accounts`);
    });

    process.exit(0);
}

createTestAccounts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
