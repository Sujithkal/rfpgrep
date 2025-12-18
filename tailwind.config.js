/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark theme (landing page)
                'bg-primary': '#0A0E27',
                'bg-secondary': '#141829',
                'bg-tertiary': '#1a1f3a',
                'border-color': '#2D2F4A',
                'text-primary': '#F0F2F5',
                'text-secondary': '#A0A5B0',
                'accent-purple': '#A855F7',
                'accent-pink': '#EC4899',
                'accent-cyan': '#00D9FF',
                'success': '#10B981',
                'warning': '#F59E0B',
                'error': '#EF4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
}
