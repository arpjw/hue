import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hue: {
          bg: "#FEFCF8",
          surface: "#F7F4EE",
          text: "#1C1A18",
          border: "rgba(28,26,24,0.09)",
          rose: "#F2B8BC",
          peach: "#F5D0A8",
          butter: "#F0E5A0",
          sage: "#B8D8B0",
          mint: "#A8DDD0",
          sky: "#B4CCE8",
          lav: "#C8B8E4",
          drose: "#B8505A",
          dsage: "#4A8A5A",
          dlav: "#7050A8",
          dsky: "#3A72A8",
          dpeach: "#B87838",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["Courier New", "Courier", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
