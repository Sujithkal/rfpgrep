import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../services/authService';

// Password validation requirements
const PASSWORD_RULES = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
};

const validatePassword = (password) => {
    return {
        minLength: password.length >= PASSWORD_RULES.minLength,
        hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
        hasLowercase: PASSWORD_RULES.hasLowercase.test(password),
        hasNumber: PASSWORD_RULES.hasNumber.test(password),
        hasSpecial: PASSWORD_RULES.hasSpecial.test(password)
    };
};

const isPasswordValid = (password) => {
    const checks = validatePassword(password);
    return Object.values(checks).every(Boolean);
};

export default function SignupPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        company: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordRules, setShowPasswordRules] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Show password rules when user starts typing password
        if (e.target.name === 'password') {
            setShowPasswordRules(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password strength
        if (!isPasswordValid(formData.password)) {
            setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await signUp(formData.email, formData.password, formData.displayName, formData.company);
            navigate('/verify-email');
        } catch (err) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                        ⚡
                    </div>
                    <h1 className="text-3xl font-bold">Create Account</h1>
                    <p className="text-text-secondary mt-2">Start automating your RFPs with AI</p>
                </div>

                {/* Signup Card */}
                <div className="card">
                    {error && (
                        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Google Sign Up */}
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            setError('');
                            try {
                                await signInWithGoogle();
                                navigate('/dashboard');
                            } catch (err) {
                                setError(err.message || 'Failed to sign up with Google');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full py-3 px-4 border border-border-color rounded-lg flex items-center justify-center gap-3 hover:bg-card-bg transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-medium">Sign up with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center mb-4">
                        <div className="flex-1 border-t border-border-color"></div>
                        <span className="px-4 text-text-secondary text-sm">or sign up with email</span>
                        <div className="flex-1 border-t border-border-color"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Work Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Company</label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Acme Inc."
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                            {/* Password Requirements Checklist */}
                            {showPasswordRules && formData.password && (
                                <div className="mt-2 p-3 bg-bg-tertiary rounded-lg text-xs space-y-1">
                                    <p className="text-text-secondary font-medium mb-2">Password must have:</p>
                                    {(() => {
                                        const checks = validatePassword(formData.password);
                                        return (
                                            <>
                                                <div className={`flex items-center gap-2 ${checks.minLength ? 'text-green-500' : 'text-text-secondary'}`}>
                                                    <span>{checks.minLength ? '✓' : '○'}</span>
                                                    <span>At least 8 characters</span>
                                                </div>
                                                <div className={`flex items-center gap-2 ${checks.hasUppercase ? 'text-green-500' : 'text-text-secondary'}`}>
                                                    <span>{checks.hasUppercase ? '✓' : '○'}</span>
                                                    <span>One uppercase letter (A-Z)</span>
                                                </div>
                                                <div className={`flex items-center gap-2 ${checks.hasLowercase ? 'text-green-500' : 'text-text-secondary'}`}>
                                                    <span>{checks.hasLowercase ? '✓' : '○'}</span>
                                                    <span>One lowercase letter (a-z)</span>
                                                </div>
                                                <div className={`flex items-center gap-2 ${checks.hasNumber ? 'text-green-500' : 'text-text-secondary'}`}>
                                                    <span>{checks.hasNumber ? '✓' : '○'}</span>
                                                    <span>One number (0-9)</span>
                                                </div>
                                                <div className={`flex items-center gap-2 ${checks.hasSpecial ? 'text-green-500' : 'text-text-secondary'}`}>
                                                    <span>{checks.hasSpecial ? '✓' : '○'}</span>
                                                    <span>One special character (!@#$%^&*)</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-4 h-4 rounded border-border-color mt-1"
                                required
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-text-secondary">
                                I agree to the{' '}
                                <a href="#" className="text-accent-purple hover:underline">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-accent-purple hover:underline">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link to="/login" className="text-accent-purple hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
