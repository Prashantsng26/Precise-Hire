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
        primary: '#2563eb',
        'deep-slate': '#151e2e',
        background: '#ffffff',
        surface: '#f8fafc',
        'text-primary': '#151e2e',
        'text-secondary': '#64748b',
        border: '#e2e8f0',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '12px',
        '3xl': '12px',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '800ms',
      },
      boxShadow: {
        'saas': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'saas-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}

