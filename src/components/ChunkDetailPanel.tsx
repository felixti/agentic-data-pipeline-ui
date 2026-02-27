"use client";

import { useCallback, useEffect, useState } from "react";

interface ChunkDetailPanelProps {
	result: any;
	strategy: "text" | "hybrid";
	query?: string;
	isOpen: boolean;
	onClose: () => void;
}

function getSourceName(result: any): string {
	if (result?.content_source_name) return result.content_source_name;
	const m = result?.metadata;
	if (!m) return "—";
	return (
		m.file_name ??
		m.filename ??
		m.source ??
		m.source_file ??
		m.document_name ??
		"—"
	);
}

function getScore(result: any, strategy: "text" | "hybrid"): number | null {
	if (strategy === "hybrid") {
		return result.hybrid_score ?? result.score ?? null;
	}
	return result.similarity_score ?? result.score ?? null;
}

export default function ChunkDetailPanel({
	result,
	strategy,
	query,
	isOpen,
	onClose,
}: ChunkDetailPanelProps) {
	const [closing, setClosing] = useState(false);

	const handleClose = useCallback(() => {
		setClosing(true);
		setTimeout(() => {
			setClosing(false);
			onClose();
		}, 250);
	}, [onClose]);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isOpen, handleClose]);

	if (!isOpen || !result) return null;

	const score = getScore(result, strategy);
	const sourceName = getSourceName(result);
	const chunkIndex = result.chunk_index ?? result.metadata?.chunk_index;
	const content = result.text ?? result.content ?? "—";
	const chunkId = result.chunk_id ?? result.id ?? "—";
	const jobId = result.job_id ?? "—";
	const rank = result.rank;

	// Metadata entries (filter out large/known fields)
	const metaEntries = result.metadata
		? Object.entries(result.metadata).filter(
				([key]) => !["embedding"].includes(key),
			)
		: [];

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-30 bg-black/20 cursor-pointer"
				onClick={handleClose}
				aria-hidden
			/>

			{/* Panel */}
			<aside
				className={`fixed top-0 right-0 bottom-0 z-40 w-[520px] bg-white border-l-4 border-ink flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,0.05)] ${closing ? "animate-slide-out-right" : "animate-slide-in-right"}`}
			>
				{/* Header */}
				<header className="flex-none bg-ink text-white px-6 py-4 flex items-center justify-between">
					<h2 className="font-bold text-sm tracking-widest uppercase flex items-center gap-3">
						<span
							className={`inline-block size-3 ${strategy === "text" ? "bg-white" : "border-2 border-white"}`}
						/>
						{strategy === "text"
							? "TEXT (BM25)"
							: "HYBRID"}
						{rank != null && (
							<span className="font-mono text-white/60 text-xs">
								RANK #{rank}
							</span>
						)}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="text-white/60 hover:text-signal transition-colors cursor-pointer"
					>
						<span
							className="material-symbols-outlined text-xl"
							aria-hidden="true"
						>
							close
						</span>
					</button>
				</header>

				{/* Body */}
				<div className="flex-1 overflow-y-auto">
					{/* Score Section */}
					<div className="px-6 py-4 border-b border-ink bg-surface">
						<div className="flex items-center gap-3 flex-wrap">
							<span
								className={`font-mono text-sm px-2.5 py-1 text-white font-bold ${strategy === "text" ? "bg-ink" : "bg-primary"}`}
							>
								{score != null ? score.toFixed(4) : "—"}
							</span>
							<span className="text-[10px] text-muted font-mono uppercase">
								{strategy === "text"
									? "SIMILARITY"
									: "HYBRID SCORE"}
							</span>
						</div>

						{/* Hybrid Score Breakdown */}
						{strategy === "hybrid" && (
							<div className="mt-3 grid grid-cols-3 gap-3">
								<div className="flex flex-col gap-0.5">
									<span className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Vector
									</span>
									<span className="font-mono text-sm font-bold">
										{result.vector_score?.toFixed(4) ??
											"—"}
									</span>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Text
									</span>
									<span className="font-mono text-sm font-bold">
										{result.text_score?.toFixed(4) ?? "—"}
									</span>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Fusion
									</span>
									<span className="font-mono text-xs font-bold uppercase">
										{result.fusion_method ?? "—"}
									</span>
								</div>
							</div>
						)}

						{/* Highlighted / Matched terms (text search) */}
						{strategy === "text" &&
							result.matched_terms?.length > 0 && (
								<div className="mt-3 flex items-center gap-2 flex-wrap">
									<span className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Matched:
									</span>
									{result.matched_terms.map(
										(term: string, i: number) => (
											<span
												key={i}
												className="font-mono text-[10px] bg-ink text-white px-1.5 py-0.5"
											>
												{term}
											</span>
										),
									)}
								</div>
							)}
					</div>

					{/* Source / Identity */}
					<div className="px-6 py-4 border-b border-ink">
						<div className="grid grid-cols-1 gap-3">
							<div className="flex items-center gap-2">
								<span className="material-symbols-outlined text-sm text-muted">
									description
								</span>
								<div>
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Source
									</div>
									<div className="font-mono text-xs font-bold break-all">
										{sourceName}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Chunk ID
									</div>
									<div className="font-mono text-[10px] break-all">
										{chunkId}
									</div>
								</div>
								<div>
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Job ID
									</div>
									<div className="font-mono text-[10px] break-all">
										{jobId}
									</div>
								</div>
							</div>

							{chunkIndex != null && (
								<div>
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Chunk Index
									</div>
									<div className="font-mono text-xs font-bold">
										{chunkIndex}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Full Content */}
					<div className="px-6 py-4 border-b border-ink">
						<div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
							Full Content
						</div>
						<div className="text-sm leading-relaxed font-display whitespace-pre-wrap break-words bg-surface p-4 border border-ink max-h-[400px] overflow-y-auto">
							{content}
						</div>
					</div>

					{/* Highlighted Content */}
					{result.highlighted_content && (
						<div className="px-6 py-4 border-b border-ink">
							<div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
								<span className="material-symbols-outlined text-xs">highlight</span>
								Highlighted Matches
							</div>
							<div
								className="text-sm leading-relaxed font-display whitespace-pre-wrap break-words bg-white p-4 border-2 border-primary/30 max-h-[300px] overflow-y-auto [&_mark]:bg-primary/20 [&_mark]:text-ink [&_mark]:font-bold [&_mark]:px-0.5 [&_mark]:border-b-2 [&_mark]:border-primary"
								dangerouslySetInnerHTML={{ __html: result.highlighted_content }}
							/>
						</div>
					)}

					{/* Metadata */}
					{metaEntries.length > 0 && (
						<div className="px-6 py-4">
							<div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
								Metadata
							</div>
							<div className="divide-y divide-ink/20">
								{metaEntries.map(([key, value]) => (
									<div
										key={key}
										className="flex justify-between items-baseline py-1.5 gap-4"
									>
										<span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">
											{key}
										</span>
										<span className="font-mono text-[11px] text-right break-all">
											{typeof value === "object"
												? JSON.stringify(value)
												: String(value ?? "—")}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
