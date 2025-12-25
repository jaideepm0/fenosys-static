tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#FFF7F5",
          100: "#FFECEB",
          200: "#FFD7E4",
          300: "#FFBDD7",
          400: "#FF9FC4",
          500: "#FF84AF",
          600: "#F06C96",
          700: "#CF5078",
          800: "#A63E60",
          900: "#7D2D47",
        },
        twilight: "#181329",
        nightfall: "#110D1D",
      },
      boxShadow: {
        "brand-glow": "0 40px 130px -60px rgba(255, 132, 175, 0.4)",
      },
    },
  },
};
