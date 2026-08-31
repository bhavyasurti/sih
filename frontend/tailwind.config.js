/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1683D8',
          bright: '#38BDF8',
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        surface: {
          primary: '#05070B',
          secondary: '#080D14',
          panel: '#0D1420',
          border: '#1C2A3A',
          hover: '#131e2e',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#9AA8B8',
        },
        status: {
          critical: '#EF4444',
          darkRed: '#7F1D1D',
          success: '#22C55E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
