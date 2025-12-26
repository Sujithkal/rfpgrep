import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'
                } ${className}`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Toggle circle */}
            <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0'
                    }`}
            >
                {isDark ? (
                    <span className="text-sm">🌙</span>
                ) : (
                    <span className="text-sm">☀️</span>
                )}
            </span>
        </button>
    );
}
