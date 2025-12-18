import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                <p className="text-gray-600 mb-6">Last updated: December 16, 2024</p>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Account information (name, email, password)</li>
                            <li>Profile information (company name, role)</li>
                            <li>Documents you upload to our platform</li>
                            <li>Payment information (processed securely via Razorpay)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your data. Your documents and personal information are encrypted both in transit and at rest. We use Firebase and Google Cloud infrastructure for secure data storage.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. AI and Your Data</h2>
                        <p>We use AI to process your documents and generate responses. Your data is NOT used to train our AI models. Each user's data is kept separate and private.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
                        <p>We retain your data for as long as your account is active. You can request deletion of your data at any time by contacting our support team.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Firebase (authentication and database)</li>
                            <li>Google Cloud (infrastructure)</li>
                            <li>Razorpay (payment processing)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
                        <p>For privacy-related questions, contact us at privacy@responseai.com</p>
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
