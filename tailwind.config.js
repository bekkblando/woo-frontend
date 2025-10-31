const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");
const typography = require('@tailwindcss/typography');


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        aurora: "aurora 30s linear infinite",
        toolFadeIn: 'toolFadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        toolFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        aurora: {
          from: {
            backgroundPosition: "0% 50%, 0% 50%",
          },
          to: {
            backgroundPosition: "100% 50%, 100% 50%",
          },
        },
      },
      boxShadow: {
        input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
      },
      colors: {
        pitchDeckBlack: "#2B2B2B",
        pitchDeckTeal: "#2CA58D",
        pitchDeckWhite: "#F1F1F1",
        pitchDeckGray: "#D9D9D9",
        pitchDeckDarkTeal: "#798478"
      },
    },
  },
  plugins: [addVariablesForColors, typography],
};

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
 
  addBase({
    ":root": newVars,
  });
}

