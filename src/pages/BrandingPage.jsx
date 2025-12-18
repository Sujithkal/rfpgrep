import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import toast from 'react-hot-toast';

// Preset color themes
const COLOR_THEMES = [
    { name: 'Indigo Purple', primary: '#6366f1', secondary: '#a855f7', bg: '#fafafa' },
    { name: 'Blue Cyan', primary: '#3b82f6', secondary: '#06b6d4', bg: '#f0f9ff' },
    { name: 'Green Teal', primary: '#10b981', secondary: '#14b8a6', bg: '#f0fdf4' },
    { name: 'Orange Red', primary: '#f97316', secondary: '#ef4444', bg: '#fff7ed' },
    { name: 'Pink Purple', primary: '#ec4899', secondary: '#8b5cf6', bg: '#fdf2f8' },
    { name: 'Dark Mode', primary: '#6366f1', secondary: '#a855f7', bg: '#1f2937' }
];

export default function BrandingPage() {
    const { user, userData } = useAuth();
    const fileInputRef = useRef(null);

    const [branding, setBranding] = useState({
        companyName: userData?.branding?.companyName || '',
        logoUrl: userData?.branding?.logoUrl || '',
        primaryColor: userData?.branding?.primaryColor || '#6366f1',
        secondaryColor: userData?.branding?.secondaryColor || '#a855f7',
        backgroundColor: userData?.branding?.backgroundColor || '#fafafa',
        showWatermark: userData?.branding?.showWatermark !== false
    });

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewLogo, setPreviewLogo] = useState(branding.logoUrl);

    // Handle logo upload
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo must be less than 2MB');
            return;
        }

        setUploading(true);
        try {
            // Preview immediately
            const reader = new FileReader();
            reader.onload = (e) => setPreviewLogo(e.target.result);
            reader.readAsDataURL(file);

            // Upload to Firebase Storage
            const logoRef = ref(storage, `users/${user.uid}/branding/logo-${Date.now()}`);
            await uploadBytes(logoRef, file);
            const downloadUrl = await getDownloadURL(logoRef);

            setBranding(prev => ({ ...prev, logoUrl: downloadUrl }));
            toast.success('Logo uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    // Apply theme preset
    const applyTheme = (theme) => {
        setBranding(prev => ({
            ...prev,
            primaryColor: theme.primary,
            secondaryColor: theme.secondary,
            backgroundColor: theme.bg
        }));
    };

    // Save branding settings
    const saveBranding = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                branding: {
                    companyName: branding.companyName,
                    logoUrl: branding.logoUrl,
                    primaryColor: branding.primaryColor,
                    secondaryColor: branding.secondaryColor,
                    backgroundColor: branding.backgroundColor,
                    showWatermark: branding.showWatermark,
                    updatedAt: new Date()
                }
            });
            toast.success('Branding saved! Changes will apply to exports.');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save branding');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/settings" className="text-gray-500 hover:text-gray-700">
                            ← Back to Settings
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">
                            🎨 White-Label Branding
                        </h1>
                    </div>
                    <button
                        onClick={saveBranding}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Plan Notice */}
                {userData?.plan === 'free' && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                            <p className="font-medium text-amber-800">Enterprise Feature</p>
                            <p className="text-sm text-amber-600">White-label exports are available on Enterprise plan. <Link to="/pricing" className="underline">Upgrade now</Link></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Panel */}
                    <div className="space-y-6">
                        {/* Company Name */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Company Name</h3>
                            <input
                                type="text"
                                value={branding.companyName}
                                onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                                placeholder="Your Company Name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Company Logo</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                    {previewLogo ? (
                                        <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-3xl text-gray-400">🏢</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Logo'}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, or SVG. Max 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Color Themes */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Color Theme</h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {COLOR_THEMES.map((theme, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => applyTheme(theme)}
                                        className={`p-3 rounded-lg border-2 transition-all ${branding.primaryColor === theme.primary
                                                ? 'border-indigo-500 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex gap-1 mb-2">
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700">{theme.name}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Colors */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={branding.primaryColor}
                                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={branding.primaryColor}
                                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={branding.secondaryColor}
                                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={branding.secondaryColor}
                                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Watermark Toggle */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Hide RFPgrep Watermark</h3>
                                    <p className="text-sm text-gray-500">Remove "Powered by RFPgrep" from exported documents</p>
                                </div>
                                <button
                                    onClick={() => setBranding(prev => ({ ...prev, showWatermark: !prev.showWatermark }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${!branding.showWatermark ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${!branding.showWatermark ? 'translate-x-7' : 'translate-x-1'
                                        }`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Export Preview</h3>
                        <div
                            className="rounded-lg border border-gray-200 overflow-hidden"
                            style={{ backgroundColor: branding.backgroundColor }}
                        >
                            {/* Header Preview */}
                            <div
                                className="p-4 text-white"
                                style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                            >
                                <div className="flex items-center gap-3">
                                    {previewLogo ? (
                                        <img src={previewLogo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                                    ) : (
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <span className="text-xl">⚡</span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold">{branding.companyName || 'Your Company'}</p>
                                        <p className="text-xs opacity-80">RFP Response Document</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content Preview */}
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-full"></div>
                                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                <div className="h-3 bg-gray-100 rounded w-4/5"></div>

                                <div className="pt-3">
                                    <div
                                        className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                                        style={{ backgroundColor: branding.primaryColor }}
                                    >
                                        Response Section
                                    </div>
                                </div>
                            </div>

                            {/* Footer Preview */}
                            {branding.showWatermark && (
                                <div className="p-3 text-center border-t border-gray-200">
                                    <p className="text-xs text-gray-400">Powered by RFPgrep ⚡</p>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            This is how your exported PDFs will look
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
