/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // required for Tailwind to scan files
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
        }
      }
    },
  }, corePlugins: {
    preflight: false, // 👈 disables Tailwind's default CSS reset
  },
  plugins: [],
}
