import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, signInWithGoogle } from '../services/authService';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            // Check if email is verified
            if (result.emailVerified === false) {
                // Redirect to verify email page
                navigate('/verify-email');
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                        ⚡
                    </div>
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-text-secondary mt-2">Sign in to your RFPgrep account</p>
                </div>

                {/* Login Card */}
                <div className="card">
                    {error && (
                        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="w-4 h-4 rounded border-border-color"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-text-secondary">
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="text-sm text-accent-purple hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-border-color"></div>
                        <span className="px-4 text-text-secondary text-sm">or</span>
                        <div className="flex-1 border-t border-border-color"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={async () => {
                            setLoading(true);
                            setError('');
                            try {
                                await signInWithGoogle();
                                navigate('/dashboard');
                            } catch (err) {
                                setError(err.message || 'Failed to sign in with Google');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full py-3 px-4 border border-border-color rounded-lg flex items-center justify-center gap-3 hover:bg-card-bg transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-medium">Continue with Google</span>
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-secondary">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-accent-purple hover:underline font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
