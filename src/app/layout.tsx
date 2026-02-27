import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

import { ConfigProvider } from "../components/providers/config-provider";
import { ReactQueryProvider } from "../components/providers/query-provider";

export const metadata: Metadata = {
	title: "Swiss System Control Plane",
	description: "Agentic Data Pipeline UI",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link
					href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body
				suppressHydrationWarning
				className={`${inter.variable} ${jetBrainsMono.variable} bg-background-light text-ink font-display overflow-hidden h-screen flex flex-col antialiased`}
			>
				{/* Top Navigation */}
				<header className="flex-none flex items-center justify-between whitespace-nowrap border-b-4 border-ink px-6 py-4 bg-white z-50 h-16">
					<div className="flex items-center gap-4 text-ink">
						<div className="size-6 bg-ink text-white flex gap-2 items-center justify-center">
							<span className="material-symbols-outlined text-sm">
								grid_view
							</span>
						</div>
						<h2 className="text-ink text-xl font-bold tracking-tighter leading-none uppercase">
							Swiss System{" "}
							<span className="font-normal text-primary ml-2 text-base">
								Control Plane
							</span>
						</h2>
					</div>
					<div className="flex items-center gap-12">
						<nav className="flex items-center gap-8">
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/"
							>
								01 MONITOR
							</Link>
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/calibration"
							>
								02 CALIBRATION
							</Link>
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/vector-inspector"
							>
								03 VECTORS
							</Link>
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/configuration"
							>
								04 CONFIG
							</Link>
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/topology"
							>
								05 TOPOLOGY
							</Link>
							<Link
								className="text-muted hover:text-primary focus:text-primary text-[11px] font-bold tracking-widest transition-all uppercase hover:translate-x-0.5"
								href="/integration"
							>
								06 INTEGRATION
							</Link>
						</nav>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 font-mono text-sm mr-4 text-ink">
								<span className="w-2 h-2 bg-green-500 block"></span>
								<span className="text-xs">SYSTEM ONLINE</span>
							</div>
							<button
								type="button"
								className="size-8 flex items-center justify-center border border-ink hover:bg-surface text-ink"
							>
								<span className="material-symbols-outlined text-lg">
									notifications
								</span>
							</button>
							<div className="flex items-center gap-2 cursor-pointer group font-mono text-sm ml-2">
								<span className="group-hover:text-signal">ADMIN</span>
								<span className="material-symbols-outlined text-[16px]">
									expand_more
								</span>
							</div>
						</div>
					</div>
				</header>

				<ConfigProvider>
					<ReactQueryProvider>{children}</ReactQueryProvider>
				</ConfigProvider>
			</body>
		</html>
	);
}
