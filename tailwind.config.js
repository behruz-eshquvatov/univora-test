/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // Light slate-50 for base
        surface: '#FFFFFF',    // Pure white for cards/panels
        primary: {
          DEFAULT: '#8b5cf6',  // Vibrant Violet for buttons
          soft: '#ede9fe',     // Light violet for active states/backgrounds
        },
        text: {
          main: '#1f2937',     // Slate 800 for main text inside white cards
          muted: '#6b7280',    // Slate 500 for secondary text inside white cards
        },
        border: '#e5e7eb',     // Soft gray border
        accent: {
          amber: '#F59E0B',
          mint: '#10B981',
          coral: '#F43F5E',
        }
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'], // Professional sans-serif
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

