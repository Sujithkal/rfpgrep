/**
 * Orphan RFP Migration Service
 * Moves standalone RFPs (created before project requirement) into an "Untitled Project"
 */

import { db } from './firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

/**
 * Find or create "Untitled Project" for a user
 */
const getOrCreateUntitledProject = async (userId) => {
    const projectsRef = collection(db, `users/${userId}/projects`);

    // Check if "Untitled Project" already exists
    const q = query(projectsRef, where('name', '==', 'Untitled Project'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Create new "Untitled Project"
    const newProject = await addDoc(projectsRef, {
        name: 'Untitled Project',
        description: 'Auto-created project for migrated RFPs',
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sections: [],
        team: {
            owner: userId,
            editors: [],
            viewers: []
        },
        isMigrated: true
    });

    console.log(`📁 Created "Untitled Project" for user ${userId}`);
    return newProject.id;
};

/**
 * Migrate orphan RFPs to the Untitled Project
 */
export const migrateOrphanRFPs = async (userId) => {
    try {
        // Get all standalone RFPs from the old collection
        const rfpsRef = collection(db, `users/${userId}/rfps`);
        const rfpsSnapshot = await getDocs(rfpsRef);

        if (rfpsSnapshot.empty) {
            console.log('No orphan RFPs found');
            return { migrated: 0 };
        }

        // Get or create Untitled Project
        const untitledProjectId = await getOrCreateUntitledProject(userId);
        const projectRef = doc(db, `users/${userId}/projects`, untitledProjectId);

        // Collect all RFP data to merge into project
        const sectionsToAdd = [];
        let migratedCount = 0;

        for (const rfpDoc of rfpsSnapshot.docs) {
            const rfpData = rfpDoc.data();

            // Convert RFP to a section in the project
            const section = {
                id: rfpDoc.id,
                name: rfpData.name || rfpData.fileName || `Migrated RFP ${migratedCount + 1}`,
                originalFileName: rfpData.fileName,
                questions: rfpData.questions || rfpData.sections?.flatMap(s => s.questions) || [],
                createdAt: rfpData.uploadedAt || rfpData.createdAt || Timestamp.now(),
                migratedFrom: 'standalone_rfp'
            };

            sectionsToAdd.push(section);
            migratedCount++;
        }

        // Update project with migrated sections
        if (sectionsToAdd.length > 0) {
            const projectSnapshot = await getDocs(query(collection(db, `users/${userId}/projects`), where('name', '==', 'Untitled Project')));
            const projectData = projectSnapshot.docs[0]?.data() || {};
            const existingSections = projectData.sections || [];

            await updateDoc(projectRef, {
                sections: [...existingSections, ...sectionsToAdd],
                updatedAt: serverTimestamp(),
                totalQuestions: sectionsToAdd.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
            });
        }

        console.log(`✅ Migrated ${migratedCount} orphan RFPs to "Untitled Project"`);
        return {
            migrated: migratedCount,
            projectId: untitledProjectId
        };

    } catch (error) {
        console.error('Error migrating orphan RFPs:', error);
        return { migrated: 0, error: error.message };
    }
};

/**
 * Check if user has orphan RFPs and migrate them on login
 */
export const checkAndMigrateOnLogin = async (userId) => {
    try {
        const rfpsRef = collection(db, `users/${userId}/rfps`);
        const snapshot = await getDocs(rfpsRef);

        if (snapshot.size > 0) {
            console.log(`Found ${snapshot.size} orphan RFPs, migrating...`);
            return await migrateOrphanRFPs(userId);
        }

        return { migrated: 0 };
    } catch (error) {
        console.error('Migration check failed:', error);
        return { migrated: 0 };
    }
};

export default {
    migrateOrphanRFPs,
    checkAndMigrateOnLogin,
    getOrCreateUntitledProject
};
