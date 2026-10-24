/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F2F3F7',
          subtle: '#E8EAF0',
          muted: '#DDE1EB',
          card: '#FFFFFF',
        },
        dark: {
          DEFAULT: '#0A282D',
          deeper: '#06171B',
          card: '#0F343A',
          border: '#1E4950',
          muted: '#8AA3A8',
        },
        accent: {
          DEFAULT: '#3DB663',
          hover: '#349E55',
          light: '#EDF8F1',
          border: '#BFE7CB',
          dark: '#1E6E37',
        },
        paper: {
          DEFAULT: '#F2F3F7',
          subtle: '#EAECEF',
          muted: '#DFE2E8',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0A282D',
          soft: '#1B383D',
          secondary: '#4A5B60',
          muted: '#7E8F95',
          faint: '#B2BFC4',
        },
        navy: {
          DEFAULT: '#0A282D',
          hover: '#071F23',
          light: '#EDF8F1',
          border: '#BFE7CB',
        },
        terracotta: {
          DEFAULT: '#B07040',
          hover: '#945B31',
          light: '#FBF3ED',
          border: '#E8CEBB',
        },
        brand: {
          primary: '#0A282D',
          bright: '#3DB663',
          50: '#F2FAF5',
          100: '#E1F5E8',
          400: '#52C776',
          500: '#3DB663',
          600: '#349E55',
          700: '#0A282D',
        },
        surface: {
          primary: '#F2F3F7',
          secondary: '#E8EAF0',
          panel: '#FFFFFF',
          border: '#D7DCE5',
          hover: '#E3E6EE',
          subtle: '#EEF0F5',
        },
        text: {
          primary: '#0A282D',
          secondary: '#4A5B60',
          muted: '#7E8F95',
        },
        status: {
          critical: '#E11D48',
          darkRed: '#9F1239',
          success: '#3DB663',
          warning: '#D97706',
          info: '#0284C7',
        }
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        sans: ['"Figtree"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
        serif: ['"Outfit"', 'sans-serif'], // Map legacy serif class to Outfit display for modern architectural elegance
      },
    },
  },
  plugins: [],
}
