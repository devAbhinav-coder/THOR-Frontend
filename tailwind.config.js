/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── Brand palette (heritage gold #c5a059 — maps all `brand-*` utilities site-wide) ──
        brand: {
          50: "#faf6ef",
          100: "#f3ead4",
          200: "#e8d4a8",
          300: "#dbbc7c",
          400: "#d1ad68",
          500: "#c5a059",
          600: "#b8924d",
          700: "#9a7a40",
          800: "#7d6234",
          900: "#664f2b",
          950: "#3a2e18",
        },
        // ── Navy / Prussian blue (#14192F base) ────────────────────────────
        navy: {
          50: "#eef0f9",
          100: "#d8ddf0",
          200: "#b4bddf",
          300: "#8894c9",
          400: "#5f6dad",
          500: "#3f4d8f",
          600: "#2f3d75",
          700: "#28335f",
          800: "#1f284c",
          900: "#14192f", // ← Prussian blue
          950: "#14192f",
        },
        // ── Gold accent (heritage gold #c5a059 — navbar, hero, chatbot) ───
        gold: {
          50: "#faf6ef",
          100: "#f3ead4",
          200: "#e8d4a8",
          300: "#dbbc7c",
          400: "#d1ad68",
          500: "#c5a059",
          600: "#b8924d",
          700: "#9a7a40",
          800: "#7d6234",
          900: "#664f2b",
        },
        // ── Account dashboard (luxury editorial palette) ─────────────────
        account: {
          primary: "#031632",
          secondary: "#775a19",
          "secondary-container": "#fed488",
          "on-secondary-container": "#785a1a",
          "primary-container": "#1a2b48",
          "on-primary-container": "#8293b5",
          surface: "#f8f9fa",
          "surface-container": "#edeeef",
          "surface-container-high": "#e7e8e9",
          "surface-container-low": "#f3f4f5",
          "surface-container-lowest": "#ffffff",
          "secondary-fixed": "#ffdea5",
          "surface-variant": "#e1e3e4",
          "on-surface": "#191c1d",
          "on-surface-variant": "#44474d",
          "outline-variant": "#c5c6ce",
          outline: "#75777e",
        },
      },
      spacing: {
        "account-gutter": "32px",
        "account-stack-lg": "48px",
        "account-stack-md": "24px",
        "account-margin-desktop": "64px",
        "account-margin-mobile": "20px",
        "account-container-max": "1280px",
      },
      maxWidth: {
        "account-container": "1280px",
      },
      boxShadow: {
        "account-paper": "0px 0px 20px rgba(3, 22, 50, 0.04)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
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
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rani-panel-in": {
          from: { opacity: "0", transform: "translateY(20px) scale(0.94)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "rani-panel-out": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
        },
        "rani-msg-user": {
          from: { opacity: "0", transform: "translateX(12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "rani-msg-bot": {
          from: { opacity: "0", transform: "translateX(-12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "rani-fab-ring": {
          "0%": { transform: "scale(1)", opacity: "0.45" },
          "100%": { transform: "scale(1.55)", opacity: "0" },
        },
        "rani-online": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(0.92)" },
        },
        "rani-header-shine": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "nav-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(450%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        fadeIn: "fadeIn 0.5s ease-out",
        "rani-panel-in": "rani-panel-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rani-panel-out": "rani-panel-out 0.22s cubic-bezier(0.4, 0, 1, 1) both",
        "rani-msg-user": "rani-msg-user 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rani-msg-bot": "rani-msg-bot 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rani-fab-ring": "rani-fab-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "rani-online": "rani-online 2s ease-in-out infinite",
        "rani-header-shine": "rani-header-shine 6s ease infinite",
        "nav-indeterminate": "nav-indeterminate 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
