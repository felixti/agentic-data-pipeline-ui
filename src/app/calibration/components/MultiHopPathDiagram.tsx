"use client";

import { useMemo } from "react";

export interface MultiHopPathDiagramProps {
	entities?: string[];
	isLoading?: boolean;
}

export default function MultiHopPathDiagram({
	entities = [],
	isLoading = false,
}: MultiHopPathDiagramProps) {
	// A placeholder visualization for HippoRAG entities mapped out sequentially.

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center p-10 bg-surface border-4 border-ink relative shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
				<div className="flex flex-col items-center gap-4 animate-pulse text-ink/50">
					<span className="material-symbols-outlined text-[32px]">share</span>
					<div className="font-mono text-xs font-bold uppercase tracking-widest">
						Tracing Reasoning Paths...
					</div>
				</div>
			</div>
		);
	}

	if (!entities.length) {
		return (
			<div className="flex-1 flex items-center justify-center p-10 bg-white border-2 border-ink shadow-[4px_4px_0px_#000] relative">
				<div className="max-w-md text-center flex flex-col items-center gap-3">
					<div className="size-12 border-2 border-ink flex items-center justify-center rotate-3 transform mb-2 text-ink">
						<span className="material-symbols-outlined font-bold">route</span>
					</div>
					<h2 className="text-xs font-black uppercase tracking-widest bg-ink text-white px-2 py-0.5 transform -rotate-1">
						Multi-Hop Explainer
					</h2>
					<p className="text-[10px] font-mono leading-relaxed text-ink/60 mt-2 max-w-[200px]">
						Provide a HippoRAG query to visualize traversal logic.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col relative bg-white border-2 border-ink shadow-[4px_4px_0px_#000] overflow-hidden">
			{/* Header Strip */}
			<div className="bg-ink text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
				<span>Reasoning Path</span>
				<span className="text-white/60 font-mono">{entities.length} Nodes</span>
			</div>

			<div className="p-6 overflow-y-auto flex-1 bg-surface relative">
				<div className="relative pl-6">
					{/* Vertical Line */}
					<div className="absolute left-[31px] top-4 bottom-8 w-0.5 bg-ink/20 border-r border-ink border-dashed" />

					<div className="flex flex-col gap-6">
						{entities.map((entity, idx) => {
							// biome-ignore lint/suspicious/noArrayIndexKey: Entities do not have unique IDs
							return (
								<div key={`${entity}-${idx}`} className="relative">
									{/* Step Marker */}
									<div className="absolute -left-[31px] top-1.5 size-4 bg-white border-2 border-ink rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-ink z-10 shadow-[1px_1px_0px_#000]">
										{idx + 1}
									</div>

									{/* Node Box */}
									<div className="ml-4 pl-4 border-l-2 border-ink pb-2 pr-4">
										<div className="inline-block bg-white border-2 border-ink px-3 py-1.5 shadow-[2px_2px_0px_#000] relative group hover:-translate-y-0.5 transition-transform max-w-full text-left break-all">
											<span className="font-bold text-xs uppercase tracking-tight relative z-10">
												{entity}
											</span>
										</div>

										{/* Linking edge (except last node) */}
										{idx < entities.length - 1 && (
											<div className="mt-3 text-[9px] font-mono text-primary/50 uppercase tracking-widest flex items-center gap-2">
												<span className="material-symbols-outlined text-[10px]">
													arrow_downward
												</span>
												HOP
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
