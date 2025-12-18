import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <h1 className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl animate-bounce">🔍</span>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Oops! Page not found
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/dashboard"
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">Maybe you were looking for:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/upload" className="text-sm text-indigo-600 hover:underline">Upload RFP</Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/pricing" className="text-sm text-indigo-600 hover:underline">Pricing</Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/contact" className="text-sm text-indigo-600 hover:underline">Contact</Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/help" className="text-sm text-indigo-600 hover:underline">Help Center</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
