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
        primary: "#f97316", // Orange-500
        secondary: "#06b6d4", // Cyan-500
        accent: "#10b981", // Emerald-500
        background: "#f8fafc", // Slate-50
        surface: "#ffffff",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
