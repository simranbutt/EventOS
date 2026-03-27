/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.25), 0 20px 60px rgba(79,70,229,0.25)',
      },
    },
  },
  plugins: [],
};

