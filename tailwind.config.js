/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         colors: {
            background: "rgb(var(--color-background) / <alpha-value>)",
            secondary: "rgb(var(--color-secondary) / <alpha-value>)",
            tertiary: "rgb(var(--color-tertiary) / <alpha-value>)",
            primary: `rgb(var(--color-primary) / <alpha-value>)`,
            accent: "rgb(var(--color-accent) / <alpha-value>)",
            accent2: "rgb(var(--color-accent2) / <alpha-value>)",
            text: "rgb(var(--color-text) / <alpha-value>)",
            error: "rgb(var(--color-error) / <alpha-value>)",
         },
      },
      fontFamily: {
         changa: ["Changa", "sans-serif"],
         chivo: ["Chivo Mono", "sans-serif"],
         kanit: ["Kanit", "sans-serif"],
         noto: ["Noto Sans", "sans-serif"],
      },
   },
   plugins: [],
};

//#007BA7 ^^
//#01796F ^^
//#008080 ^^
//#614051 ^^

//#397367
