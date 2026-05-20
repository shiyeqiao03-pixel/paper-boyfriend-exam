import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FEFCF8",
          secondary: "#F7F4EF",
          dark: "#2B2624",
        },
        foreground: {
          DEFAULT: "#2B2624",
          secondary: "#6B6561",
          muted: "#A8A29E",
        },
        primary: {
          DEFAULT: "#C45C5C",
          hover: "#B04E4E",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C45C5C",
          secondary: "#D4A574",
        },
        cream: {
          50: "#FEFCF8",
          100: "#F7F4EF",
          200: "#EDE8E0",
          300: "#DDD6CC",
        },
        charcoal: {
          50: "#F5F0EC",
          100: "#E8E2DC",
          200: "#D4CBC3",
          300: "#B8AFA7",
          400: "#9A9189",
          500: "#6B6561",
          600: "#4A4441",
          700: "#3A3532",
          800: "#2B2624",
          900: "#1C1917",
        },
        rose: {
          DEFAULT: "#C45C5C",
          50: "#FDF2F2",
          100: "#FCE8E8",
          200: "#F9D5D5",
          300: "#F0B0B0",
          400: "#E08080",
          500: "#C45C5C",
          600: "#B04E4E",
          700: "#9C4040",
        },
        border: "#E8E2DC",
        input: "#DDD6CC",
        ring: "#C45C5C",
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        button: "8px",
        xl: "24px",
      },
      fontFamily: {
        sans: [
          "LXGWWenKai",
          "LXGW WenKai",
          "Noto Sans SC",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "serif",
        ],
        display: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "serif",
        ],
        body: [
          "LXGWWenKai",
          "LXGW WenKai",
          "Noto Sans SC",
          "PingFang SC",
          "sans-serif",
        ],
      },
      maxWidth: {
        page: "960px",
        narrow: "640px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(43, 38, 36, 0.04)",
        light: "0 1px 6px rgba(43, 38, 36, 0.06)",
        subtle: "0 1px 2px rgba(43, 38, 36, 0.04)",
        rose: "0 2px 16px rgba(196, 92, 92, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 600ms ease-out",
        "fade-in-up": "fadeInUp 800ms ease-out",
        "scale-in": "scaleIn 400ms ease-out",
        "slide-in-right": "slideInRight 600ms ease-out",
        "typewriter": "typewriter 2s steps(20) forwards",
        "pulse-soft": "pulseSoft 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        typewriter: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
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
