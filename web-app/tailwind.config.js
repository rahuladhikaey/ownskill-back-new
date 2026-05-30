/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--accent-color, #8b5cf6)",
          hover: "var(--accent-color-hover, #7c3aed)",
        },
        physics: "#3b82f6",
        chemistry: "#10b981",
        math: "#a855f7",
        biology: "#ec4899",
        glass: {
          bg: "rgba(16, 20, 39, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(108, 38, 242, 0.2)",
      }
    },
  },
  plugins: [],
}
