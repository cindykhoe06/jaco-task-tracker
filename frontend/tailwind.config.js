/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Palet netral ala Notion
      colors: {
        ink: '#37352f',
        muted: '#787774',
        faint: '#a5a29c',
        line: '#e9e9e7',
        panel: '#f7f7f5',
        hover: 'rgba(55, 53, 47, 0.06)',
        danger: '#d44c47',
        pill: {
          gray: '#e8e7e4', 'gray-ink': '#32302c',
          blue: '#d3e5ef', 'blue-ink': '#183347',
          green: '#dbeddb', 'green-ink': '#1c3829',
          yellow: '#fdecc8', 'yellow-ink': '#402c1b',
          red: '#ffe2dd', 'red-ink': '#5d1715',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(15,15,15,0.08), 0 2px 4px rgba(15,15,15,0.06)',
        menu: '0 0 0 1px rgba(15,15,15,0.05), 0 3px 6px rgba(15,15,15,0.1), 0 9px 24px rgba(15,15,15,0.2)',
        modal: '0 0 0 1px rgba(15,15,15,0.05), 0 5px 10px rgba(15,15,15,0.1), 0 15px 40px rgba(15,15,15,0.2)',
      },
    },
  },
  plugins: [],
}
