import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FAF7F5",
          secondary: "#F5F0EC",
        },
        foreground: {
          DEFAULT: "#4A4441",
          secondary: "#8A827E",
          muted: "#A69E9A",
        },
        primary: {
          DEFAULT: "#D4A5A5",
          hover: "#C99595",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#B8A9C9",
          secondary: "#D9C4B0",
        },
        bubble: {
          user: "#E8D5D5",
          "user-border": "#D4C4C4",
          character: "#F0EBE6",
          "character-border": "#E8E2DC",
        },
        border: "#E8E2DC",
        input: "#D9D3CE",
        ring: "#D4A5A5",
      },
      borderRadius: {
        lg: "20px",
        md: "16px",
        sm: "12px",
        button: "24px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "PingFang SC",
          "Noto Sans SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "serif",
        ],
      },
      maxWidth: {
        page: "720px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(74, 68, 65, 0.06)",
        light: "0 2px 8px rgba(74, 68, 65, 0.08)",
        subtle: "0 1px 3px rgba(74, 68, 65, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
        "pulse-soft": "pulseSoft 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
