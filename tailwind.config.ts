import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f4faf5",
          100: "#e6f3e8",
          200: "#c8e4cf",
          300: "#9dccaa",
          400: "#70ad7f",
          500: "#4f8f61",
          600: "#3b714b",
          700: "#315a3d",
          800: "#2a4934",
          900: "#243d2d"
        },
        soil: "#6d5d4c",
        mist: "#f6f7f4"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(35, 55, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
