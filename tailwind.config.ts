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
          50: "#f7f7f7",
          100: "#eeeeee",
          200: "#e2e2e2",
          300: "#cfcfcf",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717"
        },
        soil: "#525252",
        mist: "#fafafa"
      },
      boxShadow: {
        soft: "0 0 0 1px rgba(229, 229, 229, 1)"
      }
    }
  },
  plugins: []
};

export default config;
