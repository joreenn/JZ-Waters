/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E1F5FE',
          100: '#B3E5FC',
          200: '#81D4FA',
          300: '#4FC3F7',
          400: '#29B6F6',
          500: '#03A9F4',
          600: '#1565C0',
          700: '#0D47A1',
          800: '#0A3A80',
          900: '#0D2137',
        },
        sky: {
          light: '#B3E5FC',
          DEFAULT: '#29B6F6',
          dark: '#0288D1',
        },
        pale: '#E1F5FE',
        gold: '#FFB300',
        coral: '#FF7043',
        green: '#43A047',
        darkText: '#0D2137',
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
