import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./stitch_assets/**/*.{html,js}",
	],
	theme: {
		extend: {
			colors: {
				primary: "#ff4400",
				signal: "#f94706",
				"background-light": "#ffffff",
				"background-dark": "#000000",
				ink: "#000000",
				surface: "#F4F4F4",
				muted: "#999999",
			},
			fontFamily: {
				display: ["var(--font-inter)", "sans-serif"],
				mono: ["var(--font-jetbrains-mono)", "monospace"],
			},
			borderWidth: {
				DEFAULT: "1px",
				"4": "4px",
			},
			borderRadius: {
				DEFAULT: "0px",
				none: "0px",
				sm: "0px",
				md: "0px",
				lg: "0px",
				xl: "0px",
				full: "0px",
			},
			keyframes: {
				blink: {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0" },
				},
				marquee: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-50%)" },
				},
			},
			animation: {
				blink: "blink 1s step-end infinite",
				marquee: "marquee 30s linear infinite",
			},
		},
	},
	plugins: [],
};
export default config;
