import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl shadow-md">
                            ⚡
                        </div>
                        <span className="text-xl font-bold text-gray-900">RFPgrep</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
                <p className="text-gray-600 mb-6">Last updated: December 16, 2024</p>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using RFPgrep ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
                        <p>RFPgrep is a SaaS platform that provides AI-powered RFP (Request for Proposal) response automation. Our service helps businesses streamline their proposal writing process using artificial intelligence.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Account</h2>
                        <p>To use our Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Subscription and Payments</h2>
                        <p>Our Service offers both free and paid subscription plans. Payment for paid plans will be processed through Razorpay. By subscribing to a paid plan, you agree to pay all applicable fees.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
                        <p>The content you create using our Service remains your property. However, the Service itself, including its design, code, and features, is the intellectual property of RFPgrep.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
                        <p>RFPgrep shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contact</h2>
                        <p>For questions about these terms, please contact us at support@responseai.com</p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
