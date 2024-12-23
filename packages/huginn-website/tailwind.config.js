/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "rgb(var(--background) / <alpha-value>)",
				secondary: "rgb(var(--secondary) / <alpha-value>)",
				tertiary: "rgb(var(--tertiary) / <alpha-value>)",
				primary: "rgb(var(--primary) / <alpha-value>)",
				accent: "rgb(var(--accent) / <alpha-value>)",
				accent2: "rgb(var(--accent2) / <alpha-value>)",
				success: "rgb(var(--success) / <alpha-value>)",
				text: "rgb(var(--text) / <alpha-value>)",
				error: "rgb(var(--error) / <alpha-value>)",
				warning: "rgb(var(--warning) / <alpha-value>)",
			}
		},
	},

	plugins: [require("@headlessui/tailwindcss")],
};
