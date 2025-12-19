import { db as firestore, storage } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all projects for a user (simplified - no teams for MVP)
 */
export async function getProjects(userId) {
    try {
        // Get projects directly from user's collection
        const projectsRef = collection(firestore, `users/${userId}/projects`);
        const q = query(projectsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const projects = [];
        snapshot.forEach(doc => {
            projects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return projects;
    } catch (error) {
        console.error('Error getting projects:', error);
        return []; // Return empty array instead of throwing
    }
}

/**
 * Get a single project by ID
 */
export async function getProject(userId, projectId) {
    try {
        const projectDoc = await getDoc(doc(firestore, `users/${userId}/projects/${projectId}`));

        if (!projectDoc.exists()) {
            throw new Error('Project not found');
        }

        return {
            id: projectDoc.id,
            ...projectDoc.data()
        };
    } catch (error) {
        console.error('Error getting project:', error);
        throw error;
    }
}

/**
 * Create a new project with RFP upload
 */
export async function createProject(userId, projectData) {
    try {
        // Generate project ID
        const projectId = uuidv4();

        // 1. Upload RFP file to Storage
        const fileExt = projectData.file.name.split('.').pop();
        const fileName = `${projectId}_${Date.now()}.${fileExt}`;
        const filePath = `users/${userId}/projects/${projectId}/${fileName}`;

        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, projectData.file);
        const fileURL = await getDownloadURL(storageRef);

        // 2. Create project document
        const project = {
            id: projectId,
            name: projectData.name,
            client: projectData.client || null,
            type: projectData.type || 'rfp',
            status: 'processing', // processing → ready
            priority: projectData.priority || 'medium',
            dueDate: projectData.dueDate ? Timestamp.fromDate(new Date(projectData.dueDate)) : null,

            // Owner
            owner: userId,

            // RFP Documents
            rfpDocuments: [{
                id: fileName,
                name: projectData.file.name,
                url: fileURL,
                storagePath: filePath,
                uploadedAt: Timestamp.now(),
                questionsExtracted: 0
            }],

            // Progress Tracking
            stats: {
                totalQuestions: 0,
                answered: 0,
                inReview: 0,
                approved: 0,
                progress: 0
            },

            // Sections (will be filled by parseRFPFile)
            sections: [],

            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            submittedAt: null
        };

        await setDoc(doc(firestore, `users/${userId}/projects/${projectId}`), project);

        // Note: parseRFPFile Cloud Function will auto-trigger and update the project

        return project;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

/**
 * Listen to project updates in real-time
 */
export function subscribeToProject(userId, projectId, callback) {
    const projectRef = doc(firestore, `users/${userId}/projects/${projectId}`);

    return onSnapshot(projectRef, (doc) => {
        if (doc.exists()) {
            callback({
                id: doc.id,
                ...doc.data()
            });
        }
    });
}

/**
 * Update project data
 */
export async function updateProject(userId, projectId, updates) {
    try {
        const projectRef = doc(firestore, `users/${userId}/projects/${projectId}`);
        await setDoc(projectRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

/**
 * Update project outcome (won/lost/pending) for win rate tracking
 */
export async function updateProjectOutcome(userId, projectId, outcome) {
    try {
        const projectRef = doc(firestore, `users/${userId}/projects/${projectId}`);
        await setDoc(projectRef, {
            outcome: outcome, // 'won', 'lost', 'pending', or null
            outcomeUpdatedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating project outcome:', error);
        throw error;
    }
}

/**
 * Update a specific question's response in a project
 * Now includes VERSION HISTORY tracking
 */
export async function updateProjectQuestion(userId, projectId, sectionIndex, questionIndex, questionData, userName = 'User') {
    try {
        // Get current project
        const project = await getProject(userId, projectId);

        if (!project.sections || !project.sections[sectionIndex]) {
            throw new Error('Section not found');
        }

        if (!project.sections[sectionIndex].questions || !project.sections[sectionIndex].questions[questionIndex]) {
            throw new Error('Question not found');
        }

        const currentQuestion = project.sections[sectionIndex].questions[questionIndex];

        // VERSION HISTORY: Save previous version before updating
        const versions = currentQuestion.versions || [];
        if (currentQuestion.response) {
            // Only save version if there was previous content
            versions.push({
                id: `v_${Date.now()}`,
                content: currentQuestion.response,
                editedBy: { uid: userId, name: userName },
                editedAt: new Date().toISOString(),
                changeType: currentQuestion.status || 'draft',
                trustScore: currentQuestion.trustScore || null
            });
            // Keep only last 20 versions
            if (versions.length > 20) {
                versions.shift();
            }
        }

        // Update the question with new data and versions
        project.sections[sectionIndex].questions[questionIndex] = {
            ...currentQuestion,
            ...questionData,
            versions: versions,
            lastEditedAt: new Date().toISOString(),
            lastEditedBy: { uid: userId, name: userName }
        };

        // Recalculate stats
        let answered = 0;
        let approved = 0;
        let totalQuestions = 0;

        project.sections.forEach(section => {
            section.questions?.forEach(q => {
                totalQuestions++;
                if (q.response) answered++;
                if (q.status === 'approved') approved++;
            });
        });

        const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

        // Save updated project
        await updateProject(userId, projectId, {
            sections: project.sections,
            stats: {
                totalQuestions,
                answered,
                approved,
                inReview: 0,
                progress
            }
        });

        return project.sections[sectionIndex].questions[questionIndex];
    } catch (error) {
        console.error('Error updating question:', error);
        throw error;
    }
}

/**
 * Batch update multiple questions (for batch AI generation)
 */
export async function batchUpdateQuestions(userId, projectId, updates) {
    try {
        const project = await getProject(userId, projectId);

        // Apply all updates
        updates.forEach(({ sectionIndex, questionIndex, data }) => {
            if (project.sections[sectionIndex]?.questions[questionIndex]) {
                project.sections[sectionIndex].questions[questionIndex] = {
                    ...project.sections[sectionIndex].questions[questionIndex],
                    ...data
                };
            }
        });

        // Recalculate stats
        let answered = 0;
        let approved = 0;
        let totalQuestions = 0;

        project.sections.forEach(section => {
            section.questions?.forEach(q => {
                totalQuestions++;
                if (q.response) answered++;
                if (q.status === 'approved') approved++;
            });
        });

        const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

        // Save once
        await updateProject(userId, projectId, {
            sections: project.sections,
            stats: {
                totalQuestions,
                answered,
                approved,
                inReview: 0,
                progress
            }
        });

        return true;
    } catch (error) {
        console.error('Error batch updating questions:', error);
        throw error;
    }
}
