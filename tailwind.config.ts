import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Cormorant Garamond', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Barlow', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '9999px',
      },
      colors: {
        gold: {
          50:  '#fdf9ec',
          100: '#faf0c8',
          200: '#f5de8e',
          300: '#efc654',
          400: '#e8b024',
          500: '#c8901a',
          600: '#a06d14',
          700: '#7a5011',
        },
      },
      animation: {
        'lens-spin': 'lensSpin 20s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        lensSpin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
