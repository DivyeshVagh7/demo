/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#2a3a5b",
        input: "#1a2847",
        ring: "#00d4ff",

        background: "#0f172e",
        foreground: "#f5f5f5",

        card: "#1a2847",
        "card-foreground": "#f5f5f5",

        popover: "#1a2847",
        "popover-foreground": "#f5f5f5",

        primary: {
          DEFAULT: "#00d4ff",
          foreground: "#0f172e",
        },
        secondary: {
          DEFAULT: "gold",
          foreground: "#0f172e",
        },
        destructive: {
          DEFAULT: "#f44",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "#3a4a6b",
          foreground: "#a0aac0",
        },
        accent: {
          DEFAULT: "#0fc",
          foreground: "#0f172e",
        },
        chart: {
          1: "#00d4ff",
          2: "gold",
          3: "#0fc",
          4: "#1e90ff",
          5: "#00bfff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "animate-float": {
          "0%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-20px) translateX(10px)" },
          "100%": { transform: "translateY(0px) translateX(0px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "animate-float": "animate-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}