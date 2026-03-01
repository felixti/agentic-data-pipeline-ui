"use client";

import { useEffect, useRef } from "react";

export interface GraphNetworkViewerProps {
	entities?: string[];
	isLoading?: boolean;
}

export default function GraphNetworkViewer({
	entities = [],
	isLoading = false,
}: GraphNetworkViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// A placeholder visualization for the Knowledge Graph.
	// In a complete implementation, this would use D3.js or ForceGraph2D
	// to render the nodes and edges interactively.

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center p-10 bg-surface/50 border border-ink border-dashed relative">
				<div className="flex flex-col items-center gap-4 animate-pulse text-ink/50">
					<span className="material-symbols-outlined text-[32px]">
						bubble_chart
					</span>
					<div className="font-mono text-xs font-bold uppercase tracking-widest">
						Rendering Graph...
					</div>
				</div>
			</div>
		);
	}

	if (!entities.length) {
		return (
			<div className="flex-1 flex items-center justify-center p-10 bg-white border border-ink relative overflow-hidden group">
				<div className="absolute inset-x-0 -top-px h-px bg-ink/10" />
				<div className="absolute inset-y-0 -left-px w-px bg-ink/10" />

				<div className="max-w-md text-center flex flex-col items-center gap-4 relative z-10 transition-transform group-hover:scale-[1.02]">
					<div className="size-16 rounded-full border border-ink bg-surface flex items-center justify-center mb-2 shadow-[2px_2px_0px_#000]">
						<span className="material-symbols-outlined text-[24px] text-ink">
							account_tree
						</span>
					</div>
					<h2 className="text-sm font-bold uppercase tracking-widest text-ink bg-white px-2">
						Graph Concept Map
					</h2>
					<p className="text-xs font-mono leading-relaxed text-ink/60">
						Waiting for Cognee GraphRAG query to return entities.
					</p>
				</div>

				{/* Decorative background grid pattern typical of brutalism */}
				<svg
					className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
					role="img"
					aria-label="Grid texture pattern"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Grid Structure</title>
					<defs>
						<pattern
							id="grid-pattern"
							width="40"
							height="40"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 40 0 L 0 0 0 40"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid-pattern)" />
				</svg>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="flex-1 flex relative bg-white border border-ink overflow-auto"
		>
			<div className="absolute top-4 left-4 z-10 bg-white border-2 border-ink px-3 py-1.5 shadow-[2px_2px_0px_#000] max-h-[80%]">
				<span className="text-[10px] font-bold uppercase tracking-widest text-ink block mb-0.5">
					Extracted Entities Map
				</span>
				<span className="font-mono text-[9px] text-ink/70">
					{entities.length} Extracted
				</span>
			</div>

			<div className="w-full h-full p-8 pt-24 min-h-max align-top">
				<div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
					{entities.map((entity, idx) => {
						// biome-ignore lint/suspicious/noArrayIndexKey: Entities do not have unique IDs
						return (
							<div
								key={`${entity}-${idx}`}
								className="relative px-3 py-1 bg-surface border border-ink text-xs font-mono text-ink lowercase group hover:bg-ink hover:text-white transition-colors cursor-default shadow-[1px_1px_0px_#000]"
							>
								{entity}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
