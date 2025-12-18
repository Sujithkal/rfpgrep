import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerificationEmail, logout } from '../services/authService';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verificationError, setVerificationError] = useState('');
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        // If user is verified, redirect to dashboard
        if (user?.emailVerified) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResend = async () => {
        setSending(true);
        setVerificationError('');
        try {
            await resendVerificationEmail();
            toast.success('Verification email sent! Check your inbox.');
            setCountdown(60); // 60 second cooldown
        } catch (error) {
            toast.error('Failed to send email. Try again later.');
        } finally {
            setSending(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRefresh = async () => {
        setChecking(true);
        setVerificationError('');

        try {
            // Reload the user to get fresh emailVerified status
            const auth = getAuth();
            await auth.currentUser?.reload();

            if (auth.currentUser?.emailVerified) {
                toast.success('Email verified! Redirecting...');
                navigate('/dashboard');
            } else {
                setVerificationError("You haven't verified your email yet. Please check your inbox and click the verification link first.");
            }
        } catch (error) {
            setVerificationError('Unable to check verification status. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        ⚡
                    </div>
                    <span className="text-2xl font-bold text-white">RFPgrep</span>
                </Link>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    {/* Email Icon */}
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                            ✉️
                        </div>
                        <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
                        <p className="text-white/70 mt-2">
                            We've sent a verification link to:
                        </p>
                        <p className="text-indigo-400 font-medium mt-1">
                            {user?.email || 'your email'}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3 text-white/80">
                            <span className="text-green-400 mt-0.5">1.</span>
                            <span>Check your email inbox (and spam folder)</span>
                        </div>
                        <div className="flex items-start gap-3 text-white/80">
                            <span className="text-green-400 mt-0.5">2.</span>
                            <span>Click the verification link in the email</span>
                        </div>
                        <div className="flex items-start gap-3 text-white/80">
                            <span className="text-green-400 mt-0.5">3.</span>
                            <span>Come back here and click "I've Verified"</span>
                        </div>
                    </div>
                    {/* Error Message */}
                    {verificationError && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                            ⚠️ {verificationError}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleRefresh}
                            disabled={checking}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {checking ? 'Checking...' : "✅ I've Verified My Email"}
                        </button>

                        <button
                            onClick={handleResend}
                            disabled={sending || countdown > 0}
                            className="w-full py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : '📧 Resend Verification Email'}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 text-white/50 hover:text-white transition-colors text-sm"
                        >
                            ← Use a different email
                        </button>
                    </div>
                </div>

                {/* Help text */}
                <p className="text-center text-white/50 text-sm mt-6">
                    Didn't receive the email? Check your spam folder or{' '}
                    <Link to="/contact" className="text-indigo-400 hover:underline">contact support</Link>
                </p>
            </div>
        </div>
    );
}
