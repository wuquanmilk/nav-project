/** @type {import('tailwindcss').Config} */
export default {
  // 关键：告诉 Tailwind 在哪里寻找类名
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}