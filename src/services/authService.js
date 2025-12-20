import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    deleteUser,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign up new user
export const signUp = async (email, password, displayName, company) => {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile
        await updateProfile(user, { displayName });

        // Send email verification
        await sendEmailVerification(user);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email,
            displayName,
            company,
            avatar: '',
            plan: 'free',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            teamId: user.uid, // User is their own team initially
            preferences: {
                theme: 'dark',
                emailNotifications: true,
                slackIntegrated: false
            }
        });

        // Create initial team document
        await setDoc(doc(db, 'teams', user.uid), {
            name: `${displayName}'s Team`,
            ownerId: user.uid,
            members: { [user.uid]: 'owner' },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            settings: {
                maxUsers: 1,
                maxStorage: 5000, // 5GB in MB
                aiActionsPerMonth: 50
            },
            usage: {
                rfpsProcessed: 0,
                storageUsedMB: 0,
                aiCallsMade: 0
            }
        });

        // Send welcome email via Cloud Function
        try {
            const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
            await sendWelcomeEmail({ email, name: displayName });
        } catch (emailError) {
            console.warn('Welcome email failed:', emailError);
            // Don't fail signup if email fails
        }

        return { success: true, user };
    } catch (error) {
        console.error('Sign up error:', error);
        throw error;
    }
};

// Login user
export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
            return {
                success: true,
                user,
                emailVerified: false,
                message: 'Please verify your email before logging in.'
            };
        }

        return { success: true, user, emailVerified: true };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Resend verification email
export const resendVerificationEmail = async () => {
    try {
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            await sendEmailVerification(user);
            return { success: true, message: 'Verification email sent!' };
        }
        throw new Error('No user or already verified');
    } catch (error) {
        console.error('Resend verification error:', error);
        throw error;
    }
};

// Logout user
export const logout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create new user document for first-time Google users
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                company: '',
                avatar: user.photoURL || '',
                plan: 'free',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                teamId: user.uid,
                authProvider: 'google',
                preferences: {
                    theme: 'dark',
                    emailNotifications: true,
                    slackIntegrated: false
                }
            });

            // Create initial team document
            await setDoc(doc(db, 'teams', user.uid), {
                name: `${user.displayName || 'My'}'s Team`,
                ownerId: user.uid,
                members: { [user.uid]: 'owner' },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                settings: {
                    maxUsers: 1,
                    maxStorage: 5000,
                    aiActionsPerMonth: 50
                },
                usage: {
                    rfpsProcessed: 0,
                    storageUsedMB: 0,
                    aiCallsMade: 0
                }
            });

            // Send welcome email for new Google users
            try {
                const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
                await sendWelcomeEmail({ email: user.email, name: user.displayName });
            } catch (emailError) {
                console.warn('Welcome email failed:', emailError);
            }
        }

        // Google accounts are already verified
        return { success: true, user, emailVerified: true, isNewUser: !userDoc.exists() };
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Reset password
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        // Update auth profile if display name or photo changed
        if (data.displayName || data.photoURL) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName,
                photoURL: data.photoURL
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

// Delete account
export const deleteAccount = async (userId) => {
    try {
        // Delete user document
        await deleteDoc(doc(db, 'users', userId));

        // Delete Firebase auth user
        await deleteUser(auth.currentUser);

        return { success: true };
    } catch (error) {
        console.error('Delete account error:', error);
        throw error;
    }
};

// Get user data
export const getUserData = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Get user data error:', error);
        throw error;
    }
};
