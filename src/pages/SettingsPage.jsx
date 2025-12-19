import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, logout } from '../services/authService';

export default function SettingsPage() {
    const { user, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        displayName: userData?.displayName || '',
        company: userData?.company || '',
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateUserProfile(user.uid, formData);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Plan Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Current Plan</h2>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                            <div>
                                <p className="font-semibold text-gray-900 capitalize">{userData?.plan || 'Free'} Plan</p>
                                <p className="text-sm text-gray-500">
                                    {userData?.usage?.rfpsProcessed || 0} RFPs processed this month
                                </p>
                            </div>
                            <Link to="/pricing">
                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                    Upgrade Plan
                                </button>
                            </Link>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Storage Used</span>
                                <span className="font-semibold text-gray-900">
                                    {((userData?.usage?.storageUsedMB || 0) / 1024).toFixed(2)} GB / {((userData?.settings?.maxStorage || 5000) / 1024)} GB
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">AI Actions Used</span>
                                <span className="font-semibold text-gray-900">
                                    {userData?.usage?.aiCallsMade || 0} / {userData?.settings?.aiActionsPerMonth || 50}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>

                        <div className="space-y-6">
                            {/* Gamification Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-900">Gamification</p>
                                    <p className="text-sm text-gray-500">Show badges, points, and leaderboards</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newValue = !userData?.settings?.gamificationEnabled;
                                        try {
                                            await updateUserProfile(user.uid, {
                                                'settings.gamificationEnabled': newValue
                                            });
                                            await refreshUserData();
                                            setSuccess(newValue ? 'Gamification enabled!' : 'Gamification disabled');
                                            setTimeout(() => setSuccess(''), 3000);
                                        } catch (err) {
                                            setError('Failed to update setting');
                                        }
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userData?.settings?.gamificationEnabled !== false
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${userData?.settings?.gamificationEnabled !== false
                                            ? 'translate-x-8'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-900">Email Notifications</p>
                                    <p className="text-sm text-gray-500">Get notified about RFP updates via email</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newValue = !userData?.settings?.emailNotifications;
                                        try {
                                            await updateUserProfile(user.uid, {
                                                'settings.emailNotifications': newValue
                                            });
                                            await refreshUserData();
                                            setSuccess(newValue ? 'Email notifications enabled!' : 'Email notifications disabled');
                                            setTimeout(() => setSuccess(''), 3000);
                                        } catch (err) {
                                            setError('Failed to update setting');
                                        }
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userData?.settings?.emailNotifications
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${userData?.settings?.emailNotifications
                                            ? 'translate-x-8'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Custom AI Prompts */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">🤖 Custom AI Prompts</h2>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Pro Feature</span>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Create custom AI actions that appear in the editor dropdown. Define your own prompts for specialized response styles.
                        </p>

                        {/* Existing Custom Prompts */}
                        <div className="space-y-3 mb-6">
                            {(userData?.settings?.customPrompts || []).length > 0 ? (
                                userData.settings.customPrompts.map((prompt, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <p className="font-medium text-gray-900">{prompt.name}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-md">{prompt.instructions}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const updated = userData.settings.customPrompts.filter((_, idx) => idx !== i);
                                                await updateUserProfile(user.uid, { 'settings.customPrompts': updated });
                                                setSuccess('Prompt deleted');
                                                setTimeout(() => setSuccess(''), 3000);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <span className="text-3xl mb-2 block">✨</span>
                                    <p className="text-gray-500">No custom prompts yet</p>
                                    <p className="text-sm text-gray-400">Add your first one below</p>
                                </div>
                            )}
                        </div>

                        {/* Add New Prompt */}
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Add New Prompt</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Prompt name (e.g., 'Make Concise')"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    id="newPromptName"
                                />
                                <textarea
                                    placeholder="Instructions for AI (e.g., 'Rewrite this response to be under 100 words while keeping key points')"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
                                    id="newPromptInstructions"
                                />
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" id="shareWithTeam" className="w-4 h-4 text-indigo-600 rounded" />
                                    Share with my team
                                </label>
                                <button
                                    onClick={async () => {
                                        const name = document.getElementById('newPromptName').value.trim();
                                        const instructions = document.getElementById('newPromptInstructions').value.trim();
                                        const shareWithTeam = document.getElementById('shareWithTeam').checked;
                                        if (!name || !instructions) {
                                            setError('Please fill in both fields');
                                            return;
                                        }
                                        const existing = userData?.settings?.customPrompts || [];
                                        if (existing.length >= 5) {
                                            setError('Maximum 5 custom prompts allowed');
                                            return;
                                        }
                                        await updateUserProfile(user.uid, {
                                            'settings.customPrompts': [...existing, { name, instructions, shareWithTeam, createdAt: new Date() }]
                                        });
                                        document.getElementById('newPromptName').value = '';
                                        document.getElementById('newPromptInstructions').value = '';
                                        document.getElementById('shareWithTeam').checked = false;
                                        setSuccess(shareWithTeam ? 'Custom prompt added and shared with team!' : 'Custom prompt added!');
                                        setTimeout(() => setSuccess(''), 3000);
                                    }}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                                >
                                    + Add Prompt
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Automation Settings */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">⚙️ Automation</h2>

                        <div className="space-y-4">
                            {/* Auto-export on completion */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Auto-export completed RFPs</p>
                                    <p className="text-sm text-gray-500">Automatically download PDF when all questions are answered</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await updateUserProfile(user.uid, {
                                            'settings.autoExport': !userData?.settings?.autoExport
                                        });
                                        setSuccess('Setting updated');
                                        setTimeout(() => setSuccess(''), 2000);
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userData?.settings?.autoExport
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${userData?.settings?.autoExport
                                            ? 'translate-x-8'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Auto-apply default template */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Auto-apply default template</p>
                                    <p className="text-sm text-gray-500">Apply your default template to new RFPs automatically</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await updateUserProfile(user.uid, {
                                            'settings.autoApplyTemplate': !userData?.settings?.autoApplyTemplate
                                        });
                                        setSuccess('Setting updated');
                                        setTimeout(() => setSuccess(''), 2000);
                                    }}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${userData?.settings?.autoApplyTemplate
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${userData?.settings?.autoApplyTemplate
                                            ? 'translate-x-8'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-red-200 p-8">
                        <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>

                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Sign Out
                            </button>

                            <button className="w-full px-6 py-3 bg-red-50 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                                Delete Account
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                This action cannot be undone. All your data will be permanently deleted.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
