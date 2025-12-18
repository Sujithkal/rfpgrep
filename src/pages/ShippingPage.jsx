import { Link } from 'react-router-dom';

export default function ShippingPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Shipping & Delivery Policy</h1>
                <p className="text-gray-600 mb-6">Last updated: December 16, 2024</p>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Digital Product - No Physical Shipping</h2>
                        <p>RFPgrep is a Software as a Service (SaaS) platform. We do not sell or ship any physical products. Our service is delivered entirely online.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Instant Digital Access</h2>
                        <p>Upon successful payment and account creation, you will receive:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Immediate access to your RFPgrep account</li>
                            <li>Access to all features included in your subscription plan</li>
                            <li>Confirmation email with account details</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Service Availability</h2>
                        <p>Our service is available 24/7 worldwide. You can access RFPgrep from any device with an internet connection and a modern web browser.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">No Delivery Charges</h2>
                        <p>Since RFPgrep is a digital service, there are no shipping or delivery charges. The price you see is the price you pay, with no additional fees.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Questions?</h2>
                        <p>If you have any questions about accessing our service, please contact us at support@responseai.com</p>
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
