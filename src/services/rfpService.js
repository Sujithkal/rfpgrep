import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

// Create new RFP
export const createRFP = async (file, teamId, uploadedBy, metadata = {}) => {
    try {
        const rfpId = uuidv4();
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        // Upload file to Firebase Storage
        const storageRef = ref(storage, `teams/${teamId}/rfps/${rfpId}/${fileName}`);
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);

        // Create RFP document in Firestore
        const rfpData = {
            id: rfpId,
            name: metadata.name || fileName.replace(/\.[^/.]+$/, ''),
            fileName: fileName,
            fileType: fileExt,
            fileURL: fileURL,
            uploadedAt: serverTimestamp(),
            uploadedBy: uploadedBy,
            status: 'processing', // processing | ready | error
            clientName: metadata.clientName || '',
            dueDate: metadata.dueDate || null,
            estimatedValue: metadata.estimatedValue || 0,
            sections: [],
            team: [uploadedBy],
            totalQuestions: 0,
            answeredQuestions: 0,
            metadata: {
                industry: metadata.industry || '',
                source: metadata.source || '',
            }
        };

        await setDoc(doc(db, 'teams', teamId, 'rfps', rfpId), rfpData);

        return { success: true, rfpId, data: rfpData };
    } catch (error) {
        console.error('Create RFP error:', error);
        throw error;
    }
};

// Get all RFPs for a team
export const getRFPs = async (teamId) => {
    try {
        const rfpsRef = collection(db, 'teams', teamId, 'rfps');
        const q = query(rfpsRef, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const rfps = [];
        querySnapshot.forEach((doc) => {
            rfps.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, rfps };
    } catch (error) {
        console.error('Get RFPs error:', error);
        throw error;
    }
};

// Get single RFP detail
export const getRFPDetail = async (teamId, rfpId) => {
    try {
        const rfpDoc = await getDoc(doc(db, 'teams', teamId, 'rfps', rfpId));

        if (rfpDoc.exists()) {
            return { success: true, data: { id: rfpDoc.id, ...rfpDoc.data() } };
        } else {
            throw new Error('RFP not found');
        }
    } catch (error) {
        console.error('Get RFP detail error:', error);
        throw error;
    }
};

// Update RFP
export const updateRFP = async (teamId, rfpId, updates) => {
    try {
        const rfpRef = doc(db, 'teams', teamId, 'rfps', rfpId);
        await updateDoc(rfpRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Update RFP error:', error);
        throw error;
    }
};

// Delete RFP
export const deleteRFP = async (teamId, rfpId) => {
    try {
        await deleteDoc(doc(db, 'teams', teamId, 'rfps', rfpId));
        return { success: true };
    } catch (error) {
        console.error('Delete RFP error:', error);
        throw error;
    }
};

// Update question response
export const updateQuestionResponse = async (teamId, rfpId, sectionId, questionId, responseData) => {
    try {
        const rfpDoc = await getDoc(doc(db, 'teams', teamId, 'rfps', rfpId));

        if (!rfpDoc.exists()) {
            throw new Error('RFP not found');
        }

        const rfpData = rfpDoc.data();
        const sections = rfpData.sections || [];

        // Find and update the specific question
        const updatedSections = sections.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    questions: section.questions.map(q => {
                        if (q.id === questionId) {
                            return {
                                ...q,
                                response: responseData.response,
                                trustScore: responseData.trustScore || 0,
                                citations: responseData.citations || [],
                                status: responseData.status || 'draft',
                                updatedAt: new Date().toISOString()
                            };
                        }
                        return q;
                    })
                };
            }
            return section;
        });

        await updateDoc(doc(db, 'teams', teamId, 'rfps', rfpId), {
            sections: updatedSections,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Update question response error:', error);
        throw error;
    }
};

// Get team usage stats
export const getTeamUsage = async (teamId) => {
    try {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));

        if (teamDoc.exists()) {
            const data = teamDoc.data();
            return {
                success: true,
                usage: data.usage || {
                    rfpsProcessed: 0,
                    storageUsedMB: 0,
                    aiCallsMade: 0
                }
            };
        }

        return { success: false };
    } catch (error) {
        console.error('Get team usage error:', error);
        throw error;
    }
};
