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
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

