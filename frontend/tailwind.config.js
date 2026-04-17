/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff8fa3',
          light: '#ffb3c1',
          dark: '#ff758f'
        },
        secondary: {
          DEFAULT: '#c2eaba',
        },
        accent: {
          DEFAULT: '#ffccd5',
        },
        text: {
          DEFAULT: '#4a4e69',
        }
      }
    },
  },
  plugins: [],
}
