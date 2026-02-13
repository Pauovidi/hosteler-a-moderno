import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind v4 typings require either "class" or ["class", selector].
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx,css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
