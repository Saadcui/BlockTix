/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // required for Tailwind to scan files
  ],
  theme: {
    extend: {},
  }, corePlugins: {
    preflight: false, // 👈 disables Tailwind’s default CSS reset
  },
  plugins: [],
}
