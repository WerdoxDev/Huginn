/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         colors: {
            background: "#303030",
            primary: "#ADDC6C",
            secondary: "#262626",
            tertiary: "#1d1d1d",
            accent1: "#FFC25D",
            text: "#FDF4D3",
            link: "#ADDC6CE6",
            error: "#F87171",
         },
      },
      fontFamily: {
         changa: ["Changa", "sans-serif"],
         chivo: ["Chivo Mono", "sans-serif"],
      },
   },
   plugins: [],
};
