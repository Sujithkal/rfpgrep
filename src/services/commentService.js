/**
 * Comment Service
 * Handles comment threads on RFP questions
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    where,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';

/**
 * Add a comment to a question
 */
export const addComment = async (userId, projectId, questionId, comment) => {
    try {
        const commentsRef = collection(db, `users/${userId}/projects/${projectId}/comments`);
        const newComment = {
            questionId,
            text: comment.text,
            authorId: comment.authorId,
            authorName: comment.authorName,
            authorAvatar: comment.authorAvatar || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isResolved: false,
            parentId: comment.parentId || null, // For threaded replies
            reactions: {}
        };

        const docRef = await addDoc(commentsRef, newComment);
        return { id: docRef.id, ...newComment };
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

/**
 * Get comments for a specific question
 */
export const getQuestionComments = async (userId, projectId, questionId) => {
    try {
        const commentsRef = collection(db, `users/${userId}/projects/${projectId}/comments`);
        const q = query(
            commentsRef,
            where('questionId', '==', questionId),
            orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);

        const comments = [];
        snapshot.forEach(doc => {
            comments.push({ id: doc.id, ...doc.data() });
        });

        return comments;
    } catch (error) {
        console.error('Error getting comments:', error);
        return [];
    }
};

/**
 * Subscribe to comments for a question (real-time)
 */
export const subscribeToComments = (userId, projectId, questionId, callback) => {
    const commentsRef = collection(db, `users/${userId}/projects/${projectId}/comments`);
    const q = query(
        commentsRef,
        where('questionId', '==', questionId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const comments = [];
        snapshot.forEach(doc => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        callback(comments);
    });
};

/**
 * Update a comment
 */
export const updateComment = async (userId, projectId, commentId, text) => {
    try {
        const commentRef = doc(db, `users/${userId}/projects/${projectId}/comments`, commentId);
        await updateDoc(commentRef, {
            text,
            updatedAt: serverTimestamp(),
            isEdited: true
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (userId, projectId, commentId) => {
    try {
        const commentRef = doc(db, `users/${userId}/projects/${projectId}/comments`, commentId);
        await deleteDoc(commentRef);
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

/**
 * Mark comment as resolved
 */
export const resolveComment = async (userId, projectId, commentId, resolved = true) => {
    try {
        const commentRef = doc(db, `users/${userId}/projects/${projectId}/comments`, commentId);
        await updateDoc(commentRef, {
            isResolved: resolved,
            resolvedAt: resolved ? serverTimestamp() : null
        });
    } catch (error) {
        console.error('Error resolving comment:', error);
        throw error;
    }
};

/**
 * Add reaction to a comment
 */
export const addReaction = async (userId, projectId, commentId, reactorId, emoji) => {
    try {
        const commentRef = doc(db, `users/${userId}/projects/${projectId}/comments`, commentId);
        await updateDoc(commentRef, {
            [`reactions.${reactorId}`]: emoji
        });
    } catch (error) {
        console.error('Error adding reaction:', error);
        throw error;
    }
};

/**
 * Get comment count for a project
 */
export const getProjectCommentCount = async (userId, projectId) => {
    try {
        const commentsRef = collection(db, `users/${userId}/projects/${projectId}/comments`);
        const snapshot = await getDocs(commentsRef);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting comment count:', error);
        return 0;
    }
};

/**
 * Get unresolved comments count
 */
export const getUnresolvedCount = async (userId, projectId) => {
    try {
        const commentsRef = collection(db, `users/${userId}/projects/${projectId}/comments`);
        const q = query(commentsRef, where('isResolved', '==', false));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting unresolved count:', error);
        return 0;
    }
};
