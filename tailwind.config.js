/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        forest: {
          50: "#F1F7F3",
          100: "#DDEBE0",
          200: "#BBD7C2",
          300: "#8FBBA0",
          400: "#5E9A76",
          500: "#3D7E57",
          600: "#2E7D5B",
          700: "#1B5E3F",
          800: "#164B33",
          900: "#0F3A27",
        },
        moss: {
          50: "#F5F8F0",
          100: "#E8EFDD",
          200: "#D2E0BD",
          300: "#B3C98F",
          400: "#94B063",
          500: "#7CB892",
        },
        cream: "#F7F8F5",
        amber: {
          400: "#C9A961",
          500: "#B8954A",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"PingFang SC"', '"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 20px rgba(27, 94, 63, 0.06)",
        card: "0 4px 24px rgba(27, 94, 63, 0.08)",
        hover: "0 12px 40px rgba(27, 94, 63, 0.15)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
