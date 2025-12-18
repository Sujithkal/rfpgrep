import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { loadRazorpayScript } from '../services/paymentService';
import toast from 'react-hot-toast';

// Razorpay Key - LIVE key for production
const RAZORPAY_KEY_ID = 'rzp_live_RsLnrgKYQL6GIU';

export default function TrialSignupPage() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: userData?.displayName || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
    });

    const [processing, setProcessing] = useState(false);

    // Load Razorpay script on mount
    useEffect(() => {
        loadRazorpayScript();
    }, []);

    // Check if already on trial
    if (userData?.hasUsedTrial) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
                <div className="max-w-md text-center">
                    <span className="text-6xl mb-4 block">⚠️</span>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Trial Already Used</h1>
                    <p className="text-gray-600 mb-6">You've already used your free trial. Please subscribe to continue with Professional features.</p>
                    <Link to="/pricing" className="text-indigo-600 hover:underline">View Pricing Plans →</Link>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        // Full name validation - must have at least 2 words
        const nameParts = formData.fullName.trim().split(' ').filter(part => part.length > 0);
        if (nameParts.length < 2) {
            toast.error('Please enter your full name (first and last name)');
            return false;
        }
        if (nameParts.some(part => part.length < 2)) {
            toast.error('Please enter a valid full name');
            return false;
        }

        // Phone validation - 10+ digits, only numbers
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return false;
        }

        // Address validation - minimum length and not just random characters
        if (formData.address.trim().length < 10) {
            toast.error('Please enter a complete address (minimum 10 characters)');
            return false;
        }
        // Check if address contains at least some letters (not just numbers/symbols)
        if (!/[a-zA-Z]{3,}/.test(formData.address)) {
            toast.error('Please enter a valid address');
            return false;
        }

        // City validation - only letters and spaces, min 2 chars
        if (!/^[a-zA-Z\s]{2,}$/.test(formData.city.trim())) {
            toast.error('Please enter a valid city name');
            return false;
        }

        // State validation
        if (!formData.state.trim() || formData.state.trim().length < 2) {
            toast.error('Please select or enter your state');
            return false;
        }

        // PIN code validation - exactly 6 digits for India
        const pincodeDigits = formData.pincode.replace(/\D/g, '');
        if (pincodeDigits.length !== 6) {
            toast.error('Please enter a valid 6-digit PIN code');
            return false;
        }

        return true;
    };

    const handlePayWithRazorpay = async () => {
        if (!validateForm()) return;

        setProcessing(true);

        // Create Razorpay options for ₹1 authorization
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: 100, // ₹1 in paise (for card validation)
            currency: 'INR',
            name: 'RFPgrep',
            description: '30-Day Professional Trial - Card Verification (₹1 will be refunded)',
            image: 'https://rfpgrep.com/favicon.svg',
            handler: async function (response) {
                // Payment successful - card is valid
                try {
                    const trialEndDate = new Date();
                    trialEndDate.setDate(trialEndDate.getDate() + 30);

                    await updateDoc(doc(db, 'users', user.uid), {
                        plan: 'professional',
                        planType: 'trial',
                        hasUsedTrial: true,
                        trialStartDate: new Date(),
                        trialEndDate: trialEndDate,
                        billing: {
                            fullName: formData.fullName,
                            phone: formData.phone,
                            address: formData.address,
                            city: formData.city,
                            state: formData.state,
                            pincode: formData.pincode,
                            country: formData.country,
                            razorpayPaymentId: response.razorpay_payment_id,
                            verifiedAt: new Date()
                        }
                    });

                    toast.success('🎉 Card verified! Your 30-day trial has started!');
                    navigate('/dashboard');
                } catch (error) {
                    console.error('Error starting trial:', error);
                    toast.error('Failed to start trial. Please contact support.');
                }
                setProcessing(false);
            },
            prefill: {
                name: formData.fullName,
                email: user?.email || '',
                contact: formData.phone
            },
            notes: {
                userId: user?.uid,
                purpose: 'trial_card_verification'
            },
            theme: {
                color: '#6366f1'
            },
            modal: {
                ondismiss: function () {
                    setProcessing(false);
                    toast.error('Payment cancelled. Please try again to start your trial.');
                }
            }
        };

        try {
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setProcessing(false);
                toast.error(`Payment failed: ${response.error.description}`);
            });
            razorpay.open();
        } catch (error) {
            setProcessing(false);
            toast.error('Failed to open payment. Please refresh and try again.');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Please sign in first</h2>
                    <Link to="/signup" className="text-indigo-600 hover:underline">Create Account →</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-12 px-6">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl shadow-lg">⚡</div>
                        <span className="text-2xl font-bold text-gray-900">RFPgrep</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your 30-Day Free Trial</h1>
                    <p className="text-gray-600">Full access to Professional features. Cancel anytime.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing Information</h2>
                    <p className="text-sm text-gray-500 mb-6">We'll verify your card with a ₹1 charge (refunded immediately).</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                placeholder="123 Main Street"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                    placeholder="Maharashtra"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                    placeholder="400001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option>India</option>
                                    <option>United States</option>
                                    <option>United Kingdom</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="text-sm font-medium text-blue-800">Secure Card Verification</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    A ₹1 charge will be made to verify your card (refunded within 5-7 days).<br />
                                    Your trial starts immediately. Cancel anytime before trial ends.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePayWithRazorpay}
                        disabled={processing}
                        className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {processing ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Processing...
                            </span>
                        ) : (
                            'Verify Card & Start Trial →'
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        Powered by Razorpay • 256-bit SSL Encryption
                    </p>
                </div>

                {/* Trial Benefits */}
                <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">What's included in your 30-day trial:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">✅ Unlimited RFP uploads</li>
                        <li className="flex items-center gap-2">✅ Unlimited AI responses</li>
                        <li className="flex items-center gap-2">✅ Knowledge base (100MB)</li>
                        <li className="flex items-center gap-2">✅ Team collaboration (5 members)</li>
                        <li className="flex items-center gap-2">✅ PDF & Word exports</li>
                        <li className="flex items-center gap-2">✅ Priority support</li>
                    </ul>
                </div>

                {/* FAQ */}
                <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-900">Why do you need my card?</p>
                            <p className="text-gray-600 mt-1">To verify your identity and prevent abuse. You won't be charged until the trial ends.</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">What happens after 30 days?</p>
                            <p className="text-gray-600 mt-1">You'll be charged ₹1,999/month for Professional plan. Cancel anytime before to avoid charges.</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">How do I cancel?</p>
                            <p className="text-gray-600 mt-1">Go to Settings → Subscription → Cancel. It's instant and requires no contact with support.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    By starting your trial, you agree to our{' '}
                    <Link to="/terms" className="underline">Terms</Link> and{' '}
                    <Link to="/privacy" className="underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}
