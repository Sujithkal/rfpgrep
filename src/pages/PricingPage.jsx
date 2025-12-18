import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initiatePayment, PLANS } from '../services/paymentService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export default function PricingPage() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(null);

    const currentPlan = userData?.plan || 'free';
    const hasUsedTrial = userData?.hasUsedTrial || false;
    const isOnTrial = userData?.trialEndDate && new Date(userData.trialEndDate.toDate?.() || userData.trialEndDate) > new Date();

    // Start free trial - redirect to billing page
    const handleStartTrial = () => {
        if (!user) {
            navigate('/signup');
            return;
        }

        if (hasUsedTrial) {
            toast.error('You have already used your free trial.');
            return;
        }

        // Redirect to trial signup with billing form
        navigate('/trial-signup');
    };

    const handleSubscribe = async (planId) => {
        if (!user) {
            navigate('/signup');
            return;
        }

        if (planId === 'free') {
            toast.success('You are on the Free plan!');
            return;
        }

        if (planId === currentPlan && !isOnTrial) {
            toast.success(`You're already on the ${PLANS[planId].name} plan!`);
            return;
        }

        setProcessing(planId);

        await initiatePayment({
            planId,
            user: { ...user, displayName: userData?.displayName },
            onSuccess: async (paymentData) => {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        plan: planId,
                        planType: 'paid',
                        planUpdatedAt: new Date(),
                        lastPayment: {
                            paymentId: paymentData.paymentId,
                            amount: PLANS[planId].price,
                            date: new Date()
                        }
                    });

                    toast.success(`Successfully upgraded to ${PLANS[planId].name}!`);
                    navigate('/dashboard');
                } catch (error) {
                    console.error('Error updating plan:', error);
                    toast.error('Payment received but failed to update plan. Contact support.');
                }
                setProcessing(null);
            },
            onFailure: (error) => {
                toast.error(error || 'Payment failed. Please try again.');
                setProcessing(null);
            }
        });
    };

    // Determine button text based on user state
    const getButtonText = (planId) => {
        if (planId === 'free') {
            if (currentPlan === 'free' && !isOnTrial) return 'Current Plan';
            return 'Downgrade';
        }
        if (planId === 'professional') {
            if (currentPlan === 'professional' && !isOnTrial) return 'Current Plan';
            if (isOnTrial) return 'Upgrade to Keep';
            return 'Upgrade Now';
        }
        if (planId === 'enterprise') {
            if (currentPlan === 'enterprise') return 'Current Plan';
            return 'Upgrade Now';
        }
        return 'Select Plan';
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '₹0',
            period: '/forever',
            description: 'Perfect for trying out RFPgrep',
            features: PLANS.free.features,
            cta: getButtonText('free'),
            highlighted: false,
        },
        {
            id: 'professional',
            name: 'Professional',
            price: '₹3,999',
            period: '/month',
            description: 'For growing businesses',
            features: PLANS.professional.features,
            cta: getButtonText('professional'),
            highlighted: true,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: '₹15,999',
            period: '/month',
            description: 'For large teams and agencies',
            features: PLANS.enterprise.features,
            cta: getButtonText('enterprise'),
            highlighted: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                            ⚡
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            RFPgrep
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-white/80 hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                                <Link to="/projects" className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
                                    Go to App
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-white/80 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="pt-32 pb-8 text-center px-6">
                <h1 className="text-5xl font-bold text-white mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Start free and scale as you grow. No hidden fees, cancel anytime.
                </p>
                {user && isOnTrial && (
                    <div className="mt-4 inline-block px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                        <span className="text-yellow-300">🎁 Trial Active: </span>
                        <span className="text-white font-semibold">
                            {Math.ceil((new Date(userData.trialEndDate.toDate?.() || userData.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                        </span>
                    </div>
                )}
                {user && currentPlan !== 'free' && !isOnTrial && (
                    <div className="mt-4 inline-block px-4 py-2 bg-indigo-500/20 rounded-full">
                        <span className="text-indigo-300">Current Plan: </span>
                        <span className="text-white font-semibold">{PLANS[currentPlan]?.name || 'Free'}</span>
                    </div>
                )}
            </div>

            {/* Free Trial Banner - Show for logged-in users who haven't used trial */}
            {user && !hasUsedTrial && currentPlan === 'free' && (
                <div className="max-w-4xl mx-auto px-6 pb-8">
                    <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-8 border border-indigo-500/30 text-center">
                        <span className="text-4xl mb-4 block">🎁</span>
                        <h2 className="text-2xl font-bold text-white mb-3">Start Your 30-Day Free Trial</h2>
                        <p className="text-white/70">
                            Get full access to Professional features for 30 days. Credit card required to start trial.
                        </p>
                        <button
                            onClick={handleStartTrial}
                            disabled={processing === 'trial'}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {processing === 'trial' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Starting Trial...
                                </span>
                            ) : (
                                '🚀 Start Free Trial Now'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-6 pb-16">
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl p-8 transition-all ${plan.highlighted
                                ? 'bg-white scale-105 shadow-2xl'
                                : 'bg-white/10 backdrop-blur-md border border-white/20'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                                    MOST POPULAR
                                </div>
                            )}

                            <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-gray-900' : 'text-white'}`}>
                                {plan.name}
                            </h3>

                            <div className="mb-4">
                                <span className={`text-4xl font-bold ${plan.highlighted ? 'text-gray-900' : 'text-white'}`}>
                                    {plan.price}
                                </span>
                                <span className={plan.highlighted ? 'text-gray-600' : 'text-white/60'}>
                                    {plan.period}
                                </span>
                            </div>

                            <p className={`mb-6 ${plan.highlighted ? 'text-gray-600' : 'text-white/70'}`}>
                                {plan.description}
                            </p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className={`flex items-center gap-2 ${plan.highlighted ? 'text-gray-700' : 'text-white/80'}`}>
                                        <span className={plan.highlighted ? 'text-indigo-600' : 'text-indigo-400'}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={processing === plan.id || (plan.cta === 'Current Plan')}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.cta === 'Current Plan'
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : plan.highlighted
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    } disabled:opacity-50`}
                            >
                                {processing === plan.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        Processing...
                                    </span>
                                ) : (
                                    plan.cta
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust Badges */}
            <div className="max-w-4xl mx-auto px-6 pb-16">
                <div className="flex flex-wrap items-center justify-center gap-8 text-white/60">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔒</span>
                        <span>Secure Payments via Razorpay</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💳</span>
                        <span>UPI, Cards, Net Banking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎁</span>
                        <span>30-Day Free Trial</span>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto px-6 pb-24">
                <h2 className="text-3xl font-bold text-white text-center mb-12">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-6">
                    {[
                        {
                            q: 'Can I try RFPgrep for free?',
                            a: 'Yes! Our Free plan includes 3 projects and 50 AI responses per month. No credit card required.',
                        },
                        {
                            q: 'What payment methods do you accept?',
                            a: 'We accept all major payment methods via Razorpay including UPI, Credit/Debit Cards, Net Banking, and Wallets.',
                        },
                        {
                            q: 'What happens if I exceed my limits?',
                            a: "We'll notify you when you're approaching your limit. You can upgrade at any time or wait for your monthly reset.",
                        },
                        {
                            q: 'Can I cancel my subscription?',
                            a: 'Absolutely. You can cancel anytime from your account settings. Your access continues until the end of your billing period.',
                        },
                        {
                            q: 'Is there a free trial?',
                            a: "Yes! New users get a 30-day free trial of our Professional tier with all features. Credit card required to prevent abuse - you won't be charged until the trial ends. Cancel anytime.",
                        },
                    ].map((faq, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                            <p className="text-white/70">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8">
                <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-white/50">© 2024 RFPgrep. All rights reserved.</p>
                    <div className="flex gap-6 text-white/50 text-sm">
                        <Link to="/terms" className="hover:text-white">Terms</Link>
                        <Link to="/privacy" className="hover:text-white">Privacy</Link>
                        <Link to="/refund" className="hover:text-white">Refunds</Link>
                        <Link to="/contact" className="hover:text-white">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
