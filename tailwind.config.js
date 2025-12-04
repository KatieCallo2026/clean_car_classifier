/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf8f4',
          100: '#f5f1e8',
          200: '#ede7d9',
          300: '#e3d9c5',
          400: '#d6c9ad',
          500: '#c9b896',
          600: '#b8a480',
          700: '#9d8a68',
          800: '#82715a',
          900: '#6b5e4c',
        },
        green: {
          50: '#e5f3ef',
          100: '#cce7df',
          200: '#99cfbf',
          300: '#66b79f',
          400: '#339f7f',
          500: '#00875f',
          600: '#086f4f',
          700: '#084b3f',
          800: '#06372e',
          900: '#04231e',
        },
        coffee: {
          50: '#faf6f3',
          100: '#f5ede7',
          200: '#ebdacf',
          300: '#e1c8b7',
          400: '#d7b59f',
          500: '#cb8966',
          600: '#b97752',
          700: '#9d5e3f',
          800: '#7d4a31',
          900: '#5d3624',
          950: '#41241a',
        },
      },
      fontFamily: {
        sans: ['Epilogue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
