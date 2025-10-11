/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        text: '#E0E0E0',
        accent: '#00C853',
      },
      backgroundColor: {
        primary: '#0D1117',
        secondary: '#161B22',
      },
      textColor: {
        primary: '#E0E0E0',
        secondary: '#8B949E',
      }
    },
  },
  plugins: [],
}