import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserData } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);

                    // Fetch additional user data from Firestore
                    const { data } = await getUserData(firebaseUser.uid);
                    setUserData(data);
                } else {
                    setUser(null);
                    setUserData(null);
                }
            } catch (err) {
                console.error('Auth state change error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Function to manually refresh user data
    const refreshUserData = async () => {
        if (user) {
            try {
                const { data } = await getUserData(user.uid);
                setUserData(data);
            } catch (err) {
                console.error('Failed to refresh user data:', err);
            }
        }
    };

    // TEAM COLLABORATION: Compute effective team context
    const teamContext = useMemo(() => {
        if (!userData || !user) {
            return {
                effectiveTeamId: null,
                isTeamOwner: false,
                isTeamMember: false,
                teamRole: null,
                canEdit: false,
                canApprove: false,
                canManageTeam: false
            };
        }

        // Check if user is a member of another team
        const teamId = userData.teamId || user.uid;
        const isTeamOwner = !userData.teamId || userData.teamId === user.uid;
        const isTeamMember = userData.teamId && userData.teamId !== user.uid;

        // Use teamRole (set during invite accept) or role, default to viewer
        const role = isTeamOwner ? 'owner' : (userData.teamRole || userData.role || 'viewer');

        console.log('[AuthContext] Team context computed:', {
            teamId,
            isTeamOwner,
            isTeamMember,
            role,
            userDataTeamRole: userData.teamRole,
            userDataRole: userData.role
        });

        return {
            effectiveTeamId: teamId,           // The team to load data for
            isTeamOwner,                        // True if this user owns the team
            isTeamMember,                       // True if member of another's team
            teamRole: role,                     // owner | admin | editor | viewer
            canEdit: ['owner', 'admin', 'editor'].includes(role),
            canApprove: ['owner', 'admin'].includes(role),
            canManageTeam: ['owner', 'admin'].includes(role)
        };
    }, [userData, user]);

    const value = {
        user,
        userData,
        loading,
        error,
        setError,
        refreshUserData,
        // Team collaboration context
        ...teamContext
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

