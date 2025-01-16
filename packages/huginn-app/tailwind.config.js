/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "rgb(var(--color-background) / <alpha-value>)",
				secondary: "rgb(var(--color-secondary) / <alpha-value>)",
				tertiary: "rgb(var(--color-tertiary) / <alpha-value>)",
				primary: "rgb(var(--color-primary) / <alpha-value>)",
				accent: "rgb(var(--color-accent) / <alpha-value>)",
				accent2: "rgb(var(--color-accent2) / <alpha-value>)",
				success: "rgb(var(--color-success) / <alpha-value>)",
				text: "rgb(var(--color-text) / <alpha-value>)",
				error: "rgb(var(--color-error) / <alpha-value>)",
				warning: "rgb(var(--color-warning) / <alpha-value>)",
			},
		},
		fontFamily: {
			noto: ["Noto Sans", "sans-serif"],
			ubuntu: ["Ubuntu Mono", "monospace"],
		},
	},
	plugins: [],
};
