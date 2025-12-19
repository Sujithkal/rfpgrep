import { createContext, useContext, useState, useEffect } from 'react';
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

    const value = {
        user,
        userData,
        loading,
        error,
        setError,
        refreshUserData
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
