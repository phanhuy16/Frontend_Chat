/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#137fec',
        'primary-hover': '#0056b3',
        'background-light': '#ffffff',
        'background-dark': '#0b0d0e',
        'input-light': '#f3f4f6',
        'input-dark': '#1e293b',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

