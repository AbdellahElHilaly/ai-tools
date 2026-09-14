/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        brand: "var(--color-brand)",
        line: "var(--color-line)"
      },
      fontFamily: { sans: ["Inter", "Noto Sans Arabic", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
};
