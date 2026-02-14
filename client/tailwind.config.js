/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: '#6366f1', // Indigo 500
                secondary: '#64748b', // Slate 500
                accent: '#8b5cf6', // Violet 500
                dark: '#0f172a', // Slate 900
                light: '#f8fafc', // Slate 50
                glass: 'rgba(255, 255, 255, 0.1)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-pattern': "url('/pattern.svg')", // Placeholder if needed
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }
        },
    },
    plugins: [],
}
