import { Link } from 'react-router-dom';

export default function RefundPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Cancellation & Refund Policy</h1>
                <p className="text-gray-600 mb-6">Last updated: December 17, 2024</p>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Free Trial</h2>
                        <p>New users receive a <strong>30-day free trial</strong> of our Professional tier with full features. Credit card is required to start your trial to prevent abuse. You won't be charged until the trial ends.</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Full access to Professional tier features during trial</li>
                            <li>Credit card required - but no charge until trial ends</li>
                            <li>Cancel anytime before trial ends to avoid charges</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Free Tier</h2>
                        <p>After your trial ends, you can continue using RFPgrep on our free tier indefinitely with limited features. No payment is ever required for the free tier.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Subscription Cancellation</h2>
                        <p>You may cancel your subscription at any time from your account settings. Upon cancellation:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Your subscription will remain active until the end of the current billing period</li>
                            <li>You will not be charged for the next billing cycle</li>
                            <li>Your account will automatically downgrade to the free tier</li>
                            <li>Your data will be retained for 30 days after downgrade</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Refund Policy</h2>
                        <p>We offer a generous 30-day free trial (credit card required). Refunds are available If you cancel within the first 7 days after being charged. After 7 days, we may consider refunds in the following exceptional cases:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Technical Issues:</strong> If you experience persistent technical issues that prevent you from using the service, contact support for a prorated refund</li>
                            <li><strong>Billing Errors:</strong> Duplicate charges or billing errors will be refunded immediately upon verification</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. How to Request a Refund</h2>
                        <p>To request a refund for exceptional cases:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-2">
                            <li>Email us at billing@responseai.com</li>
                            <li>Include your registered email address</li>
                            <li>Provide details of the technical issue or billing error</li>
                            <li>We will review your request within 5-7 business days</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Digital Product Notice</h2>
                        <p>RFPgrep is a digital SaaS product. There are no physical goods shipped. Access to the service is provided immediately upon successful payment or trial activation.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact</h2>
                        <p>For billing and refund inquiries, contact us at billing@responseai.com</p>
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
