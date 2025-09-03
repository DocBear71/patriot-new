/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                patriot: {
                    red: '#DC2626',
                    blue: '#1E40AF',
                    gold: '#F59E0B',
                    navy: '#1E3A8A',
                    silver: '#6B7280'
                },
                military: {
                    army: '#4B5C2A',
                    navy: '#0F1419',
                    airforce: '#1B365D',
                    marines: '#CC0000',
                    coastguard: '#FF8C00'
                }
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'military': ['Oswald', 'sans-serif']
            }
        },
    },
    plugins: [],
}