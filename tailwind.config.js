/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5ff',
          100: '#ebe9ff',
          200: '#d6d1ff',
          300: '#bbb0ff',
          400: '#9b86ff',
          500: '#7a5bff',
          600: '#5f38f7',
          700: '#4c2dd5',
          800: '#3925a4',
          900: '#251b73',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        midnight: {
          50: '#f3f6ff',
          100: '#e4ecff',
          200: '#cbd6ff',
          300: '#a7b4ff',
          400: '#7f8cf7',
          500: '#5f6ae3',
          600: '#4a54c7',
          700: '#3942a1',
          800: '#2c327a',
          900: '#1f2353',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-cal)', 'Plus Jakarta Sans', 'system-ui'],
      },
      backgroundImage: {
        'soft-grid': 'radial-gradient(circle at 1px 1px, rgba(90, 102, 241, 0.08) 1px, transparent 0)',
        'aurora': 'radial-gradient(120% 120% at 0% 0%, rgba(122, 91, 255, 0.18) 0%, rgba(122, 91, 255, 0) 60%), radial-gradient(120% 120% at 100% 0%, rgba(45, 212, 191, 0.18) 0%, rgba(45, 212, 191, 0) 60%), radial-gradient(120% 120% at 50% 100%, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0) 55%)',
      },
      boxShadow: {
        floating: '0 24px 60px -12px rgba(38, 27, 115, 0.2)',
        subtle: '0 14px 40px -20px rgba(12, 18, 38, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
