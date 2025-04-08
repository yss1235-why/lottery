/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C3E50',
        secondary: '#3498DB',
        accent: '#FF6B6B',
        'neutral-dark': '#1A1A2E',
        'neutral-light': '#F7F7F7',
        'prize-gold': '#F1C40F',
        success: '#2ECC71',
        alert: '#F39C12',
      }
    }
  },
  plugins: []
}