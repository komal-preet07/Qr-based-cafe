export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#C8965A',
        surface: '#FAFAF9',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}