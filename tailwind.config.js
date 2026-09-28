/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { mymAqua: "#72C8D0", mymLight: "#DDF3F4", mymBg: "#F7FBFA", mymDark: "#243638" }
    }
  },
  plugins: [],
}
