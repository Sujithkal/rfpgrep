import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await resetPassword(email);
            setEmailSent(true);
            toast.success('Password reset email sent!');
        } catch (error) {
            console.error('Reset password error:', error);
            if (error.code === 'auth/user-not-found') {
                toast.error('No account found with this email');
            } else {
                toast.error('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <span className="text-2xl font-bold text-white">RFPgrep</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-bg-secondary border border-border-color rounded-2xl p-8 shadow-xl">
                    {!emailSent ? (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                            <p className="text-text-secondary mb-6">
                                Enter your email and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg-primary border border-border-color rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                                        placeholder="you@company.com"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✉️</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                            <p className="text-text-secondary mb-6">
                                We've sent a password reset link to:
                            </p>
                            <p className="text-accent-purple font-medium mb-6">{email}</p>
                            <p className="text-text-muted text-sm mb-6">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                            <button
                                onClick={() => setEmailSent(false)}
                                className="text-accent-purple hover:underline"
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-text-secondary hover:text-white text-sm">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
