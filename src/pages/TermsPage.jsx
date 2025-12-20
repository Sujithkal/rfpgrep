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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                <p className="text-gray-600 mb-8">Last updated: December 20, 2024</p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                    <p className="text-yellow-800 text-sm">
                        <strong>Please read carefully:</strong> By using RFPgrep, you agree to these terms. If you don't agree, please don't use our service.
                    </p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using RFPgrep ("Service"), operated by RFPgrep ("we", "us", "our"), you accept and agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
                        <p>RFPgrep is a SaaS platform that provides AI-powered RFP (Request for Proposal) response automation. Our service helps businesses streamline their proposal writing process using artificial intelligence. Features include:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Document parsing and question extraction</li>
                            <li>AI-generated response suggestions</li>
                            <li>Answer library management</li>
                            <li>Team collaboration features</li>
                            <li>Export to various formats (PDF, Word, CSV)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>You must be at least 18 years old to create an account</li>
                            <li>You are responsible for maintaining the security of your account credentials</li>
                            <li>You must provide accurate and complete information when creating an account</li>
                            <li>You are responsible for all activities that occur under your account</li>
                            <li>Notify us immediately if you suspect unauthorized access to your account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. AI-Generated Content Disclaimer</h2>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                            <p className="text-red-800">
                                <strong>⚠️ Important:</strong> AI-generated responses are suggestions only. They may contain errors, inaccuracies, or inappropriate content. You are solely responsible for reviewing, editing, and verifying all AI-generated content before use.
                            </p>
                        </div>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>AI responses are not professional, legal, or financial advice</li>
                            <li>We do not guarantee the accuracy or suitability of AI-generated content</li>
                            <li>You must review all content before submitting to clients or third parties</li>
                            <li>We are not liable for any damages resulting from AI-generated content</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Subscription & Payments</h2>
                        <p><strong>Free Plan:</strong> We offer a free tier with limited features. No payment is required.</p>
                        <p className="mt-4"><strong>Paid Plans:</strong></p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Payments are processed securely through Razorpay</li>
                            <li>Subscriptions are billed monthly or annually as selected</li>
                            <li>Prices are in INR and may be subject to applicable taxes</li>
                            <li>You agree to pay all fees associated with your subscription</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Refund Policy</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                            <p className="text-green-800">
                                <strong>7-Day Refund Policy:</strong> If you're not satisfied with our paid service, you may request a full refund within 7 days of your first payment. Contact support@rfpgrep.com with your refund request.
                            </p>
                        </div>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Refunds are available within 7 days of initial subscription purchase</li>
                            <li>Refunds are not available after the 7-day period</li>
                            <li>Refunds will be processed within 5-10 business days</li>
                            <li>Annual subscriptions may receive prorated refunds at our discretion</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Cancellation</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>You may cancel your subscription at any time from Settings</li>
                            <li>Cancellation takes effect at the end of your current billing period</li>
                            <li>You'll retain access to paid features until your subscription expires</li>
                            <li>We don't offer partial refunds for unused time (except within refund period)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Acceptable Use</h2>
                        <p>You agree NOT to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Upload illegal, harmful, or offensive content</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights of others</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Use automated scripts, bots, or scrapers without permission</li>
                            <li>Resell or redistribute our service without authorization</li>
                            <li>Upload malware, viruses, or malicious code</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Intellectual Property</h2>
                        <p><strong>Your Content:</strong> You retain all rights to the content you upload and create using our Service.</p>
                        <p className="mt-4"><strong>Our Service:</strong> The Service itself, including its design, code, features, trademarks, and branding, is the intellectual property of RFPgrep and is protected by applicable laws.</p>
                        <p className="mt-4"><strong>License:</strong> You grant us a limited license to process your content solely for the purpose of providing the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Service Availability</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>We strive for high availability but don't guarantee 100% uptime</li>
                            <li>We may perform scheduled maintenance with advance notice</li>
                            <li>We are not liable for service interruptions beyond our control</li>
                            <li>We may modify or discontinue features with reasonable notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
                        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>We provide the Service "AS IS" without warranties of any kind</li>
                            <li>We are not liable for indirect, incidental, special, consequential, or punitive damages</li>
                            <li>Our total liability shall not exceed the amount you paid us in the last 12 months</li>
                            <li>We are not liable for lost profits, lost data, or business interruption</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Indemnification</h2>
                        <p>You agree to indemnify and hold harmless RFPgrep, its officers, directors, employees, and agents from any claims, damages, or expenses arising from:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Your use of the Service</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Content you upload or create using the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Termination</h2>
                        <p>We may suspend or terminate your account if:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>You violate these Terms of Service</li>
                            <li>You engage in fraudulent or illegal activity</li>
                            <li>Your payment method fails repeatedly</li>
                            <li>You abuse the Service or other users</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Governing Law</h2>
                        <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. We will notify users of significant changes by:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Posting the updated terms on this page</li>
                            <li>Updating the "Last updated" date</li>
                            <li>Sending email notification for material changes</li>
                        </ul>
                        <p className="mt-4">Continued use after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Contact</h2>
                        <p>For questions about these terms:</p>
                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                            <p><strong>Email:</strong> <a href="mailto:support@rfpgrep.com" className="text-indigo-600 hover:underline">support@rfpgrep.com</a></p>
                            <p className="mt-2"><strong>Website:</strong> <a href="https://rfpgrep.com" className="text-indigo-600 hover:underline">rfpgrep.com</a></p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        ← Back to Home
                    </Link>
                    <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Privacy Policy →
                    </Link>
                </div>
            </div>
        </div>
    );
}
