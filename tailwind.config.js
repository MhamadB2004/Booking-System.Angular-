/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        malath: {
          50: '#fdf8f6',
          100: '#f2e8e3',
          500: '#C08261',
          600: '#ab7051',
          700: '#8c5a41',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      }
    }
  },
  plugins: [],
}