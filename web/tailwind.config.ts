import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF2FB", 100: "#D6E6F7", 200: "#AECEEF", 300: "#7FB0E4",
          400: "#4E8FD6", 500: "#1F6FBE", 600: "#0057A8", 700: "#084C8D",
          800: "#0B3E70", 900: "#073763",
        },
        // Akcent — ciepły koral, świadome przełamanie błękitu (CTA, akcenty, gradienty).
        accent: {
          50: "#FFF3EC", 100: "#FFE3D4", 200: "#FFC4A9", 300: "#FF9F73",
          400: "#FF7A45", 500: "#FB5E26", 600: "#E8480F", 700: "#BE390C",
        },
        ice: "#F7FAFD",
        graphite: "#151515",
        muted: "#5F6670",
        hair: "#DDE5EE",
        ok: "#1F7A4D",
        warn: "#B7791F",
        err: "#B42318",
        spk: {
          blue: "#2563EB", amber: "#D97706", teal: "#0D9488",
          violet: "#7C3AED", rose: "#E11D48",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { xl: "14px", "2xl": "18px" },
      boxShadow: {
        card: "0 1px 2px rgba(7,55,99,0.04), 0 8px 24px -12px rgba(7,55,99,0.14)",
        lift: "0 6px 16px -6px rgba(7,55,99,0.18), 0 18px 40px -18px rgba(7,55,99,0.22)",
        ring: "0 0 0 4px rgba(0,87,168,0.14)",
        glow: "0 8px 30px -8px rgba(0,87,168,0.35)",
        glowAccent: "0 10px 34px -10px rgba(251,94,38,0.45)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shineSweep: { "0%": { left: "-150%" }, "100%": { left: "150%" } },
        auroraDrift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(4%,-3%,0) scale(1.08)" },
          "66%": { transform: "translate3d(-3%,2%,0) scale(0.96)" },
        },
        huepulse: { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "0.9" } },
        borderspin: { "to": { transform: "rotate(360deg)" } },
        textshimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        floatY: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        meshA: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(6%,-5%,0) scale(1.12)" } },
        meshB: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(-7%,4%,0) scale(0.92)" } },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        floaty: "floaty 6s ease-in-out infinite",
        aurora: "auroraDrift 18s ease-in-out infinite",
        huepulse: "huepulse 4s ease-in-out infinite",
        borderspin: "borderspin 6s linear infinite",
        textshimmer: "textshimmer 6s linear infinite",
        floatY: "floatY 7s ease-in-out infinite",
        meshA: "meshA 22s ease-in-out infinite",
        meshB: "meshB 26s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
