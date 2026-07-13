import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0f766e", // Teal 700
          hover: "#115e59", // Teal 800
        },
        secondary: {
          DEFAULT: "#eab308", // Yellow 500
          hover: "#ca8a04", // Yellow 600
        }
      },
    },
  },
  plugins: [],
};
export default config;
