/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Rajdhani", "Arial Narrow", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#080b12",
        panel: "#101722",
        neon: "#c7ff35",
      },
      boxShadow: {
        neon: "0 0 30px rgba(199,255,53,.18)",
      },
    },
  },
  plugins: [],
};
