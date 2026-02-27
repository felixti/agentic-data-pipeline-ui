"use client";

import { useState } from "react";
import ChunkDetailPanel from "@/components/ChunkDetailPanel";
import {
	useHybridSearch,
	useRagQuery,
	useSemanticTextSearch,
	useTextSearch,
} from "@/lib/api/hooks";
import type { SemanticTextSearchResultItem } from "@/lib/api/search";

type FusionMethod = "weighted_sum" | "rrf";
type RagStrategy = "auto" | "fast" | "balanced" | "thorough";

interface SearchResult {
	chunk_id?: string;
	id?: string;
	chunk_index?: number;
	content?: string;
	text?: string;
	highlighted_content?: string;
	similarity_score?: number;
	hybrid_score?: number;
	score?: number;
	content_source_name?: string;
	metadata?: {
		file_name?: string;
		filename?: string;
		source?: string;
		source_file?: string;
		document_name?: string;
		page?: number;
		chunk_index?: number;
	};
}

export default function Calibration() {
	/* ── Query ─────────────────────────────────────────── */
	const [query, setQuery] = useState("");

	/* ── Shared params ─────────────────────────────────── */
	const [topK, setTopK] = useState(25);
	const [jobIdFilter, setJobIdFilter] = useState("");

	/* ── Hybrid params ─────────────────────────────────── */
	const [vectorWeight, setVectorWeight] = useState(0.7);
	const textWeight = Math.round((1 - vectorWeight) * 100) / 100;
	const [minSimilarity, setMinSimilarity] = useState(0.5);
	const [fusionMethod, setFusionMethod] = useState<FusionMethod>("weighted_sum");

	const isRrf = fusionMethod === "rrf";
	const effectiveVW = isRrf ? 0.5 : vectorWeight;
	const effectiveTW = isRrf ? 0.5 : textWeight;

	const handleVectorChange = (v: number) => setVectorWeight(Math.round(v * 100) / 100);
	const handleTextChange = (v: number) => setVectorWeight(Math.round((1 - v) * 100) / 100);

	/* ── Semantic params ───────────────────────────────── */
	const [enableReranking, setEnableReranking] = useState(true);
	const [deduplicate, setDeduplicate] = useState(false);
	const [includeContext, setIncludeContext] = useState(false);
	const [entityFilter, setEntityFilter] = useState("");

	/* ── RAG ───────────────────────────────────────────── */
	const [ragOpen, setRagOpen] = useState(false);
	const [ragStrategy, setRagStrategy] = useState<RagStrategy>("balanced");

	/* ── Detail panel ──────────────────────────────────── */
	const [selectedChunk, setSelectedChunk] = useState<{
		result: SearchResult;
		strategy: "text" | "hybrid";
	} | null>(null);

	/* ── Mutations ─────────────────────────────────────── */
	const textMutation = useTextSearch();
	const hybridMutation = useHybridSearch();
	const semanticMutation = useSemanticTextSearch();
	const ragMutation = useRagQuery();

	/* ── Handlers ──────────────────────────────────────── */
	const buildFilters = () =>
		jobIdFilter.trim() ? { job_id: jobIdFilter.trim() } : undefined;

	const handleRunQuery = () => {
		if (!query.trim()) return;
		const filters = buildFilters();

		textMutation.mutate({
			query,
			top_k: topK,
			language: "english",
			use_fuzzy: true,
			highlight: true,
			...(filters ? { filters } : {}),
		});

		hybridMutation.mutate({
			query,
			top_k: topK,
			vector_weight: Math.round(effectiveVW * 100) / 100,
			text_weight: Math.round(effectiveTW * 100) / 100,
			fusion_method: fusionMethod,
			min_similarity: minSimilarity,
			...(filters ? { filters } : {}),
		});

		semanticMutation.mutate({
			query,
			top_k: topK,
			min_similarity: minSimilarity,
			...(filters ? { filters } : {}),
		});
	};

	const handleRunRag = () => {
		if (!query.trim()) return;
		ragMutation.mutate({ query, strategy: ragStrategy, top_k: 5 });
	};

	/* ── Helpers ───────────────────────────────────────── */
	const textResults: SearchResult[] =
		(textMutation.data as { results?: SearchResult[] } | undefined)?.results ?? [];
	const hybridResults: SearchResult[] =
		(hybridMutation.data as { results?: SearchResult[] } | undefined)?.results ?? [];
	const semanticResults: SemanticTextSearchResultItem[] =
		semanticMutation.data?.results ?? [];

	const textLatency: number | undefined =
		(textMutation.data as { search_time_ms?: number; query_time_ms?: number } | undefined)
			?.search_time_ms ??
		(textMutation.data as { query_time_ms?: number } | undefined)?.query_time_ms;
	const hybridLatency: number | undefined =
		(hybridMutation.data as { search_time_ms?: number; query_time_ms?: number } | undefined)
			?.search_time_ms ??
		(hybridMutation.data as { query_time_ms?: number } | undefined)?.query_time_ms;
	const semanticLatency = semanticMutation.data?.query_time_ms;

	const isRunning =
		textMutation.isPending ||
		hybridMutation.isPending ||
		semanticMutation.isPending;

	const getScore = (result: SearchResult, strategy: "text" | "hybrid") => {
		if (strategy === "hybrid") return result.hybrid_score ?? result.score ?? null;
		return result.similarity_score ?? result.score ?? null;
	};

	const getSourceName = (result: SearchResult) => {
		if (result?.content_source_name) return result.content_source_name;
		const m = result?.metadata;
		if (!m) return null;
		return (
			m.file_name ?? m.filename ?? m.source ?? m.source_file ?? m.document_name ?? null
		);
	};

	/* ── Result card renderer ──────────────────────────── */
	const renderCard = (
		result: SearchResult,
		idx: number,
		strategy: "text" | "hybrid",
		usePrimaryScore = false,
	) => {
		const score = getScore(result, strategy);
		const source = getSourceName(result);
		return (
			<button
				key={idx}
				type="button"
				className={`w-full text-left border border-ink bg-white p-4 flex flex-col gap-3 cursor-pointer hover:border-primary hover:shadow-[2px_2px_0px_#ff4400] transition-all ${idx > 2 && strategy === "text" ? "opacity-50 hover:opacity-100" : ""}`}
				onClick={() => setSelectedChunk({ result, strategy })}
			>
				<div className="flex justify-between items-baseline">
					<span
						className={`font-mono text-xs px-1.5 py-0.5 ${usePrimaryScore ? "bg-primary text-white" : "bg-ink text-white"}`}
					>
						{score != null ? score.toFixed(3) : "—"}
					</span>
					<span className="font-mono text-[9px] text-muted uppercase">
						ID{" "}
						{result.chunk_id?.substring(0, 8) ??
							result.id?.substring(0, 8) ??
							`#${idx + 1}`}
					</span>
				</div>
				{result.highlighted_content ? (
					<p
						className="text-sm leading-snug font-display line-clamp-4 [&_mark]:bg-primary/20 [&_mark]:text-ink [&_mark]:font-bold [&_mark]:px-0.5"
						dangerouslySetInnerHTML={{ __html: result.highlighted_content }}
					/>
				) : (
					<p className="text-sm leading-snug font-display line-clamp-4">
						{result.text ?? result.content ?? "—"}
					</p>
				)}
				<div className="pt-2 border-t border-ink flex justify-between items-center">
					<div className="flex items-center gap-1.5">
						<span className="material-symbols-outlined text-[14px]">
							description
						</span>
						<span className="text-[9px] font-bold uppercase tracking-widest">
							{source ?? "SOURCE"}
						</span>
					</div>
					<span className="text-[9px] font-mono">
						{result.chunk_index != null
							? `CHUNK ${result.chunk_index}`
							: result.metadata?.page
								? `P. ${result.metadata.page}`
								: ""}
					</span>
				</div>
			</button>
		);
	};

	const renderSemanticCard = (result: SemanticTextSearchResultItem, idx: number) => {
		const source = getSourceName(result as SearchResult);
		return (
			<button
				key={idx}
				type="button"
				className="w-full text-left border border-ink bg-white p-4 flex flex-col gap-3 cursor-pointer hover:border-primary hover:shadow-[2px_2px_0px_#ff4400] transition-all"
				onClick={() =>
					setSelectedChunk({ result: { ...result, text: result.content }, strategy: "text" })
				}
			>
				<div className="flex justify-between items-baseline">
					<span className="font-mono text-xs bg-ink text-white px-1.5 py-0.5"
						style={{ background: "#1a1a2e" }}
					>
						{result.similarity_score != null
							? result.similarity_score.toFixed(3)
							: "—"}
					</span>
					<span className="font-mono text-[9px] text-muted uppercase">
						RANK {result.rank ?? idx + 1}
					</span>
				</div>
				<p className="text-sm leading-snug font-display line-clamp-4">
					{result.content ?? "—"}
				</p>
				<div className="pt-2 border-t border-ink flex justify-between items-center">
					<div className="flex items-center gap-1.5">
						<span className="material-symbols-outlined text-[14px]">
							description
						</span>
						<span className="text-[9px] font-bold uppercase tracking-widest">
							{source ?? "SOURCE"}
						</span>
					</div>
					<span className="text-[9px] font-mono">
						{result.chunk_index != null ? `CHUNK ${result.chunk_index}` : ""}
					</span>
				</div>
			</button>
		);
	};

	return (
		<main className="flex flex-1 overflow-hidden">
			{/* ── Sidebar ─────────────────────────────────── */}
			<aside className="w-[260px] min-w-[260px] flex flex-col border-r border-ink bg-white h-full overflow-y-auto">
				<div className="p-5 border-b border-ink">
					<h1 className="text-xl font-black tracking-tight leading-none mb-0.5">
						CALIBRATION
					</h1>
					<p className="text-xs text-muted font-mono uppercase tracking-wide">
						A/B/C Retrieval Testing
					</p>
				</div>

				<div className="flex-1 flex flex-col p-5 gap-6 overflow-y-auto">
					{/* Query */}
					<div className="flex flex-col gap-2">
						<div className="text-xs font-bold uppercase tracking-wide text-ink flex justify-between">
							Search Query
							<span className="text-primary font-mono tracking-tighter">REQ</span>
						</div>
						<textarea
							className="w-full h-24 p-3 text-sm font-medium bg-white border border-ink focus:border-primary focus:ring-0 resize-none placeholder-muted font-display"
							placeholder="Enter semantic query..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>

					{/* Shared: Top K */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-baseline">
							<div className="text-xs font-bold uppercase">Top K</div>
							<span className="font-mono text-primary font-bold tracking-tighter text-sm">
								{topK}
							</span>
						</div>
						<input
							max="100"
							min="1"
							step="1"
							type="range"
							value={topK}
							onChange={(e) => setTopK(Number(e.target.value))}
						/>
						<div className="flex justify-between text-[9px] text-muted font-mono uppercase">
							<span>Narrow</span>
							<span>Broad</span>
						</div>
					</div>

					{/* Shared: Job ID Filter */}
					<div className="flex flex-col gap-2">
						<div className="text-xs font-bold uppercase tracking-wide">
							Filter by Job ID
						</div>
						<input
							className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
							placeholder="Optional job UUID..."
							value={jobIdFilter}
							onChange={(e) => setJobIdFilter(e.target.value)}
						/>
					</div>

					{/* Hybrid section */}
					<div className="flex flex-col gap-4 pt-4 border-t border-ink border-dashed">
						<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
							Strategy B · Hybrid
						</div>

						{/* Vector Weight */}
						<div className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}>
							<div className="flex justify-between items-baseline">
								<div className="text-xs font-bold uppercase">Vector Weight</div>
								<span className="font-mono text-primary font-bold tracking-tighter text-sm">
									{effectiveVW.toFixed(2)}
								</span>
							</div>
							<input
								max="1"
								min="0"
								step="0.05"
								type="range"
								value={effectiveVW}
								disabled={isRrf}
								onChange={(e) => handleVectorChange(Number(e.target.value))}
							/>
						</div>

						{/* Text Weight */}
						<div className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}>
							<div className="flex justify-between items-baseline">
								<div className="text-xs font-bold uppercase">Text Weight</div>
								<span className="font-mono text-primary font-bold tracking-tighter text-sm">
									{effectiveTW.toFixed(2)}
								</span>
							</div>
							<input
								max="1"
								min="0"
								step="0.05"
								type="range"
								value={effectiveTW}
								disabled={isRrf}
								onChange={(e) => handleTextChange(Number(e.target.value))}
							/>
							{isRrf && (
								<div className="text-[9px] font-mono text-muted text-center">
									RRF uses fixed 0.50 / 0.50
								</div>
							)}
							{!isRrf && (
								<div className="text-[9px] font-mono text-muted text-center">
									Σ = {(effectiveVW + effectiveTW).toFixed(2)}
								</div>
							)}
						</div>

						{/* Min Similarity */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between items-baseline">
								<div className="text-xs font-bold uppercase">Min Similarity</div>
								<span className="font-mono text-primary font-bold tracking-tighter text-sm">
									{minSimilarity.toFixed(2)}
								</span>
							</div>
							<input
								max="1"
								min="0"
								step="0.05"
								type="range"
								value={minSimilarity}
								onChange={(e) => setMinSimilarity(Number(e.target.value))}
							/>
						</div>

						{/* Fusion Method */}
						<div className="flex flex-col gap-2">
							<div className="text-xs font-bold uppercase">Fusion Method</div>
							<div className="flex border border-ink">
								<button
									type="button"
									className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${fusionMethod === "weighted_sum" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
									onClick={() => setFusionMethod("weighted_sum")}
								>
									Weighted Sum
								</button>
								<button
									type="button"
									className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide border-l border-ink transition-colors ${fusionMethod === "rrf" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
									onClick={() => setFusionMethod("rrf")}
								>
									RRF
								</button>
							</div>
						</div>
					</div>

					{/* Semantic section */}
					<div className="flex flex-col gap-3 pt-4 border-t border-ink border-dashed">
						<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
							Strategy C · Semantic
						</div>

						<label className="flex items-center gap-3 cursor-pointer group">
							<input
								checked={enableReranking}
								className="swiss-checkbox"
								type="checkbox"
								onChange={(e) => setEnableReranking(e.target.checked)}
							/>
							<span className="text-xs font-medium group-hover:text-primary transition-colors">
								Rerank Results
							</span>
						</label>

						<label className="flex items-center gap-3 cursor-pointer group">
							<input
								checked={deduplicate}
								className="swiss-checkbox"
								type="checkbox"
								onChange={(e) => setDeduplicate(e.target.checked)}
							/>
							<span className="text-xs font-medium group-hover:text-primary transition-colors">
								Deduplicate
							</span>
						</label>

						<label className="flex items-center gap-3 cursor-pointer group">
							<input
								checked={includeContext}
								className="swiss-checkbox"
								type="checkbox"
								onChange={(e) => setIncludeContext(e.target.checked)}
							/>
							<span className="text-xs font-medium group-hover:text-primary transition-colors">
								Include Context Chunks
							</span>
						</label>

						<div className="flex flex-col gap-1.5">
							<div className="text-xs font-bold uppercase">Entity Filter</div>
							<input
								className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
								placeholder="e.g. Microsoft..."
								value={entityFilter}
								onChange={(e) => setEntityFilter(e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Run button */}
				<div className="p-0 mt-auto border-t border-ink bg-white sticky bottom-0">
					<button
						type="button"
						className="w-full h-12 bg-ink text-white font-bold text-sm hover:bg-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
						disabled={!query.trim() || isRunning}
						onClick={handleRunQuery}
					>
						<span className="material-symbols-outlined text-[18px]">
							{isRunning ? "hourglass_empty" : "play_arrow"}
						</span>
						{isRunning ? "Running..." : "Run All Strategies"}
					</button>
				</div>
			</aside>

			{/* ── Main results area ────────────────────────── */}
			<section className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
				{/* Column headers */}
				<div className="flex-none grid grid-cols-3 border-b border-ink bg-white uppercase min-w-0">
					{/* Strategy A */}
					<div className="p-4 border-r border-ink flex items-center justify-between min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<div className="size-3 bg-ink shrink-0" />
							<h3 className="font-bold text-[11px] tracking-wide truncate">
								A: TEXT (BM25)
							</h3>
						</div>
						<span className="font-mono text-xs text-muted tracking-tighter flex-shrink-0 ml-2">
							{textLatency != null ? `${Math.round(textLatency)}ms` : "—"}
						</span>
					</div>

						{/* Strategy B */}
					<div className="p-4 border-r border-ink flex items-center justify-between min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<div className="size-3 border-2 border-ink shrink-0" />
							<h3 className="font-bold text-[11px] tracking-wide truncate">
								B: HYBRID ({isRrf ? "RRF" : `V${effectiveVW}/T${effectiveTW}`})
							</h3>
						</div>
						<span className="font-mono text-xs text-muted tracking-tighter shrink-0 ml-2">
							{hybridLatency != null ? `${Math.round(hybridLatency)}ms` : "—"}
						</span>
					</div>

					{/* Strategy C */}
					<div className="p-4 flex items-center justify-between min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<div
								className="size-3 shrink-0"
								style={{ background: "#1a1a2e" }}
							/>
							<h3 className="font-bold text-[11px] tracking-wide truncate">
								C: SEMANTIC{enableReranking ? " + RERANK" : ""}
							</h3>
						</div>
						<span className="font-mono text-xs text-muted tracking-tighter flex-shrink-0 ml-2">
							{semanticLatency != null ? `${Math.round(semanticLatency)}ms` : "—"}
						</span>
					</div>
				</div>

				{/* Results columns */}
				<div className="flex-1 grid grid-cols-3 overflow-hidden h-full min-h-0">
					{/* ── Strategy A: Text ─────────────────── */}
					<div className="border-r border-ink overflow-y-auto bg-white p-5 flex flex-col gap-3">
						{textMutation.isPending && (
							<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs animate-pulse">
								Searching...
							</div>
						)}
						{textMutation.isError && (
							<div className="text-red-600 font-mono text-xs p-3 border border-red-300">
								{textMutation.error.message}
							</div>
						)}
						{!textMutation.isPending &&
							!textMutation.isError &&
							textResults.length === 0 && (
								<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs">
									Run a query to see results
								</div>
							)}
						{textResults.map((result, idx) =>
							renderCard(result, idx, "text", false),
						)}
					</div>

					{/* ── Strategy B: Hybrid ───────────────── */}
					<div className="border-r border-ink overflow-y-auto bg-surface/50 p-5 flex flex-col gap-3">
						{hybridMutation.isPending && (
							<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs animate-pulse">
								Searching...
							</div>
						)}
						{hybridMutation.isError && (
							<div className="text-red-600 font-mono text-xs p-3 border border-red-300">
								{hybridMutation.error.message}
							</div>
						)}
						{!hybridMutation.isPending &&
							!hybridMutation.isError &&
							hybridResults.length === 0 && (
								<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs">
									Run a query to see results
								</div>
							)}
						{hybridResults.map((result, idx) =>
							renderCard(result, idx, "hybrid", true),
						)}
					</div>

					{/* ── Strategy C: Semantic ─────────────── */}
					<div className="overflow-y-auto bg-white p-5 flex flex-col gap-3">
						{semanticMutation.isPending && (
							<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs animate-pulse">
								Searching...
							</div>
						)}
						{semanticMutation.isError && (
							<div className="text-red-600 font-mono text-xs p-3 border border-red-300">
								{semanticMutation.error.message}
							</div>
						)}
						{!semanticMutation.isPending &&
							!semanticMutation.isError &&
							semanticResults.length === 0 && (
								<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs">
									Run a query to see results
								</div>
							)}
						{semanticResults.map((result, idx) =>
							renderSemanticCard(result, idx),
						)}
					</div>
				</div>

				{/* ── RAG Query Panel ──────────────────────── */}
				<div className="flex-none border-t border-ink bg-white">
					<button
						type="button"
						className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors"
						onClick={() => setRagOpen((v: boolean) => !v)}
					>
						<div className="flex items-center gap-2">
							<span className="material-symbols-outlined text-[16px]">
								{ragOpen ? "expand_more" : "chevron_right"}
							</span>
							<span className="text-xs font-bold uppercase tracking-widest">
								RAG Mode
							</span>
							<span className="text-[9px] font-mono text-muted uppercase border border-ink px-1.5 py-0.5">
								/api/v1/rag/query
							</span>
						</div>
						{ragMutation.data && (
							<span className="text-[9px] font-mono text-muted">
								{ragMutation.data.strategy_used?.toUpperCase()} ·{" "}
								{ragMutation.data.metrics?.latency_ms != null
									? `${Math.round(ragMutation.data.metrics.latency_ms)}ms`
									: ""}
							</span>
						)}
					</button>

					{ragOpen && (
						<div className="border-t border-ink p-5 flex flex-col gap-4">
							{/* Strategy selector + run */}
							<div className="flex items-end gap-4">
								<div className="flex flex-col gap-1.5">
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Strategy Preset
									</div>
									<div className="flex border border-ink">
										{(["auto", "fast", "balanced", "thorough"] as RagStrategy[]).map(
											(s) => (
												<button
													key={s}
													type="button"
													className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors border-r border-ink last:border-r-0 ${ragStrategy === s ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
													onClick={() => setRagStrategy(s)}
												>
													{s}
												</button>
											),
										)}
									</div>
								</div>
								<button
									type="button"
									className="h-9 px-6 bg-ink text-white font-bold text-xs hover:bg-primary transition-colors flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
									disabled={!query.trim() || ragMutation.isPending}
									onClick={handleRunRag}
								>
									<span className="material-symbols-outlined text-[15px]">
										{ragMutation.isPending ? "hourglass_empty" : "psychology"}
									</span>
									{ragMutation.isPending ? "Thinking..." : "Ask RAG"}
								</button>
							</div>

							{/* RAG answer */}
							{ragMutation.isError && (
								<div className="text-red-600 font-mono text-xs p-3 border border-red-300">
									{ragMutation.error.message}
								</div>
							)}
							{ragMutation.data && (
								<div className="flex flex-col gap-3">
									{/* Answer */}
									<div className="p-4 border border-ink bg-surface/30">
										<div className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
											Answer
										</div>
										<p className="text-sm leading-relaxed font-display whitespace-pre-wrap">
											{ragMutation.data.answer}
										</p>
									</div>

									{/* Metrics row */}
									{ragMutation.data.metrics && (
										<div className="flex gap-4 flex-wrap">
											{[
												{ label: "Latency", value: `${Math.round(ragMutation.data.metrics.latency_ms)}ms` },
												{ label: "Tokens", value: ragMutation.data.metrics.tokens_used },
												{ label: "Retrieval Score", value: ragMutation.data.metrics.retrieval_score?.toFixed(3) },
												{ label: "Chunks Used", value: `${ragMutation.data.metrics.chunks_used}/${ragMutation.data.metrics.chunks_retrieved}` },
											].map(({ label, value }) => (
												<div key={label} className="flex flex-col border-l-2 border-ink pl-2">
													<span className="text-[8px] text-muted font-mono uppercase">{label}</span>
													<span className="font-bold font-mono text-xs">{value}</span>
												</div>
											))}
											{ragMutation.data.query_type && (
												<div className="flex flex-col border-l-2 border-ink pl-2">
													<span className="text-[8px] text-muted font-mono uppercase">Query Type</span>
													<span className="font-bold font-mono text-xs uppercase">{ragMutation.data.query_type}</span>
												</div>
											)}
										</div>
									)}

									{/* Sources */}
									{ragMutation.data.sources && ragMutation.data.sources.length > 0 && (
										<div className="flex flex-col gap-2">
											<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
												Sources ({ragMutation.data.sources.length})
											</div>
											<div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
												{ragMutation.data.sources.map((src, i) => (
													<div
														key={src.chunk_id ?? `rag-src-${i}`}
														className="flex gap-3 items-start p-2 border border-ink/30 bg-surface/20"
													>
														<span className="font-mono text-[9px] bg-ink text-white px-1 py-0.5 shrink-0">
															{src.similarity_score?.toFixed(3) ?? `#${i + 1}`}
														</span>
														<p className="text-xs text-muted leading-snug line-clamp-2 font-display">
															{src.content}
														</p>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			{/* Chunk Detail Panel */}
			<ChunkDetailPanel
				result={selectedChunk?.result}
				strategy={selectedChunk?.strategy ?? "text"}
				query={query}
				isOpen={selectedChunk != null}
				onClose={() => setSelectedChunk(null)}
			/>
		</main>
	);
}
