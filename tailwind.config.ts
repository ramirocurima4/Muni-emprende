import type { Config } from "tailwindcss";

/**
 * Paleta institucional oficial de MuniEmprende — Municipalidad de San Roque.
 * Inspirada en el material gráfico de la Dirección de Empleo y Emprendedores
 * y Dirección de Producción, verificada para cumplir contraste WCAG AA (>= 4.5:1).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            DEFAULT: "#3D7A1E",
            vibrant: "#559125",
            hover: "#2E6115",
            dark: "#244F10",
            soft: "#E7F3DC",
            sage: "#C4D9A2",
          },
          amber: {
            DEFAULT: "#F5A623",
            hover: "#E09112",
            gold: "#F7B500",
            soft: "#FEF3DC",
            text: "#8A4F00",
          },
          sky: {
            DEFAULT: "#7498D0",
            light: "#DCE9F9",
            tint: "#EDF4FC",
            bg: "#E8F1F8",
            dark: "#1F4478",
          },
          cream: "#FDFBF7",
          surface: "#FFFFFF",
          ink: "#18261C",
          muted: "#4E5D52",
          border: "#E6E4DC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
