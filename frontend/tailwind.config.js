/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#04473C',
          hover: '#03352D',
          light: '#E6F0EE',
        },
        gold: '#C6A87C',
        destructive: '#8F2727',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};