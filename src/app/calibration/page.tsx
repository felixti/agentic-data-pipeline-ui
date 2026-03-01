"use client";

import { useState } from "react";
import ChunkDetailPanel from "@/components/ChunkDetailPanel";
import {
	useCogneeSearch,
	useHipporagRetrieve,
	useHybridSearch,
	useRagQuery,
	useSemanticTextSearch,
	useTextSearch,
} from "@/lib/api/hooks";
import type { SemanticTextSearchResultItem } from "@/lib/api/search";
import ClassificationBadge, {
	type ClassificationType,
} from "./components/ClassificationBadge";
import GraphNetworkViewer from "./components/GraphNetworkViewer";
import MultiHopPathDiagram from "./components/MultiHopPathDiagram";
import { renderCard, type SearchResult } from "./components/SearchResultCard";

type FusionMethod = "weighted_sum" | "rrf";
type RagStrategy = "auto" | "fast" | "balanced" | "thorough";
type ViewMode = "explore" | "compare";
type ActiveTab = "text" | "hybrid" | "semantic" | "cognee" | "hippo";

export default function Calibration() {
	/* ── View State ─────────────────────────────────────── */
	const [viewMode, setViewMode] = useState<ViewMode>("explore");
	const [activeTab, setActiveTab] = useState<ActiveTab>("hybrid");

	/* ── Compare Mode State ─────────────────────────────── */
	const [compareCol1, setCompareCol1] = useState<ActiveTab>("text");
	const [compareCol2, setCompareCol2] = useState<ActiveTab>("hybrid");
	const [compareCol3, setCompareCol3] = useState<ActiveTab>("semantic");

	/* ── Query ─────────────────────────────────────────── */
	const [query, setQuery] = useState("");

	/* ── Shared params ─────────────────────────────────── */
	const [topK, setTopK] = useState(25);
	const [jobIdFilter, setJobIdFilter] = useState("");

	/* ── Hybrid params ─────────────────────────────────── */
	const [vectorWeight, setVectorWeight] = useState(0.7);
	const textWeight = Math.round((1 - vectorWeight) * 100) / 100;
	const [minSimilarity, setMinSimilarity] = useState(0.5);
	const [fusionMethod, setFusionMethod] =
		useState<FusionMethod>("weighted_sum");

	const isRrf = fusionMethod === "rrf";
	const effectiveVW = isRrf ? 0.5 : vectorWeight;
	const effectiveTW = isRrf ? 0.5 : textWeight;

	const handleVectorChange = (v: number) =>
		setVectorWeight(Math.round(v * 100) / 100);
	const handleTextChange = (v: number) =>
		setVectorWeight(Math.round((1 - v) * 100) / 100);

	/* ── Semantic params ───────────────────────────────── */
	const [enableReranking, setEnableReranking] = useState(true);
	const [deduplicate, setDeduplicate] = useState(false);
	const [includeContext, setIncludeContext] = useState(false);
	const [entityFilter, setEntityFilter] = useState("");

	/* ── Cognee params ─────────────────────────────────── */
	const [cogneeStrategy, setCogneeStrategy] = useState<
		"vector" | "graph" | "hybrid"
	>("hybrid");
	const [graphDataset, setGraphDataset] = useState("");

	/* ── HippoRAG params ───────────────────────────────── */
	// HippoRAG no longer requires UI sliders for hops/PPR

	/* ── RAG ───────────────────────────────────────────── */
	const [ragOpen, setRagOpen] = useState(false);
	const [ragStrategy, setRagStrategy] = useState<RagStrategy>("balanced");

	/* ── Detail panel ──────────────────────────────────── */
	const [selectedChunk, setSelectedChunk] = useState<{
		result: SearchResult;
		strategy: "text" | "hybrid" | "semantic";
	} | null>(null);

	/* ── Mutations ─────────────────────────────────────── */
	const textMutation = useTextSearch();
	const hybridMutation = useHybridSearch();
	const semanticMutation = useSemanticTextSearch();
	const cogneeMutation = useCogneeSearch();
	const hippoMutation = useHipporagRetrieve();
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

		if (
			viewMode === "compare" ||
			(viewMode === "explore" && activeTab === "cognee")
		) {
			cogneeMutation.mutate({
				query,
				search_type: cogneeStrategy,
				top_k: topK,
				...(graphDataset ? { dataset_id: graphDataset } : {}),
			});
		}

		if (
			viewMode === "compare" ||
			(viewMode === "explore" && activeTab === "hippo")
		) {
			hippoMutation.mutate({
				queries: [query],
				num_to_retrieve: topK,
				...(graphDataset ? { dataset_id: graphDataset } : {}),
			});
		}
	};

	const handlePresetClick = (
		preset: "fast" | "balanced" | "thorough" | "graphrag",
	) => {
		switch (preset) {
			case "fast":
				setActiveTab("text");
				setTopK(10);
				break;
			case "balanced":
				setActiveTab("hybrid");
				setVectorWeight(0.7);
				setFusionMethod("weighted_sum");
				setTopK(25);
				break;
			case "thorough":
				setActiveTab("semantic");
				setEnableReranking(true);
				setDeduplicate(true);
				setIncludeContext(true);
				setTopK(50);
				break;
			case "graphrag":
				setActiveTab("hippo");
				setTopK(10);
				break;
		}
	};

	const handleRunRag = () => {
		if (!query.trim()) return;
		ragMutation.mutate({ query, strategy: ragStrategy, top_k: 5 });
	};

	const handleSelectChunk = (
		r: SearchResult,
		strategy: "text" | "hybrid" | "semantic",
	) => {
		setSelectedChunk({
			result: strategy === "semantic" ? { ...r, text: r.content } : r,
			strategy,
		});
	};

	/* ── Helpers ───────────────────────────────────────── */
	const textResults: SearchResult[] =
		(textMutation.data as { results?: SearchResult[] } | undefined)?.results ??
		[];
	const hybridResults: SearchResult[] =
		(hybridMutation.data as { results?: SearchResult[] } | undefined)
			?.results ?? [];
	const semanticResults: SemanticTextSearchResultItem[] =
		semanticMutation.data?.results ?? [];

	const textLatency: number | undefined =
		(
			textMutation.data as
				| { search_time_ms?: number; query_time_ms?: number }
				| undefined
		)?.search_time_ms ??
		(textMutation.data as { query_time_ms?: number } | undefined)
			?.query_time_ms;
	const hybridLatency: number | undefined =
		(
			hybridMutation.data as
				| { search_time_ms?: number; query_time_ms?: number }
				| undefined
		)?.search_time_ms ??
		(hybridMutation.data as { query_time_ms?: number } | undefined)
			?.query_time_ms;
	const semanticLatency = semanticMutation.data?.query_time_ms;

	// Cognee / Hippo results are visualized with special components,
	// but we still want them to map easily if we fallback to cards.
	const cogneeResults = (cogneeMutation.data?.results ?? []).map((r) => ({
		...r,
		similarity_score: r.score,
	}));

	const hippoResultsRaw = hippoMutation.data?.results?.[0];
	const hippoResults = hippoResultsRaw
		? hippoResultsRaw.passages.map((p, i) => ({
				chunk_id: `hippo-${i}`,
				content: p,
				similarity_score: hippoResultsRaw.scores[i],
				metadata: { source: hippoResultsRaw.source_documents[i] },
			}))
		: [];

	const cogneeLatency = cogneeMutation.data?.query_time_ms;
	const hippoLatency = hippoMutation.data?.query_time_ms;

	// Mock classification logic for demonstration purposes
	const getClassification = (): { type: ClassificationType; conf: number } => {
		const lowerQ = query.toLowerCase();
		if (!lowerQ) return { type: "unknown", conf: 0 };
		if (
			lowerQ.includes("what") ||
			lowerQ.includes("who") ||
			lowerQ.includes("when")
		)
			return { type: "factual", conf: 0.92 };
		if (
			lowerQ.includes("why") ||
			lowerQ.includes("how") ||
			lowerQ.includes("compare")
		)
			return { type: "analytical", conf: 0.84 };
		if (lowerQ.length < 15) return { type: "vague", conf: 0.76 };
		return { type: "unknown", conf: 0 };
	};
	const classification = getClassification();

	const isRunning =
		textMutation.isPending ||
		hybridMutation.isPending ||
		semanticMutation.isPending ||
		cogneeMutation.isPending ||
		hippoMutation.isPending;

	/* ── Views ─────────────────────────────────────────── */

	const renderCompareSelector = (
		currentVal: ActiveTab,
		setter: (v: ActiveTab) => void,
	) => (
		<div className="absolute top-3 right-4 z-20">
			<select
				value={currentVal}
				onChange={(e) => setter(e.target.value as ActiveTab)}
				className="bg-surface border border-ink text-[10px] font-bold uppercase tracking-widest px-2 py-1 outline-none focus:border-primary shadow-[2px_2px_0px_#000]"
			>
				<option value="text">BM25 Text</option>
				<option value="hybrid">Hybrid</option>
				<option value="semantic">Semantic</option>
				<option value="cognee">Cognee</option>
				<option value="hippo">HippoRAG</option>
			</select>
		</div>
	);

	const renderResultsColumn = (
		title: string,
		subtitle: string,
		// biome-ignore lint/suspicious/noExplicitAny: Allows multiple types of mutation hooks
		mutation: any,
		// biome-ignore lint/suspicious/noExplicitAny: Allows multiple types of results arrays
		results: any[],
		strategyType: "text" | "hybrid" | "semantic" | "cognee" | "hippo",
		latency?: number,
		bgClass = "bg-white",
		usePrimaryScore = false,
		selector?: React.ReactNode,
		colKey?: string | number,
	) => (
		<div
			key={colKey}
			className={`flex-1 flex flex-col min-w-0 border-r border-ink ${bgClass} relative`}
		>
			{selector}
			<div className="p-4 border-b border-ink flex items-center justify-between min-w-0 bg-white sticky top-0 z-10">
				<div className="flex items-center gap-2 min-w-0">
					<div
						className={`size-3 shrink-0 ${strategyType === "semantic" || strategyType === "cognee" || strategyType === "hippo" ? "" : strategyType === "hybrid" ? "border-2 border-ink" : "bg-ink"}`}
						style={
							strategyType === "semantic" ||
							strategyType === "cognee" ||
							strategyType === "hippo"
								? { background: "#1a1a2e" }
								: {}
						}
					/>
					<h3 className="font-bold text-[11px] tracking-wide truncate uppercase">
						{title} <span className="text-muted font-normal">({subtitle})</span>
					</h3>
				</div>
				<span className="font-mono text-xs text-muted tracking-tighter shrink-0 ml-2">
					{latency != null ? `${Math.round(latency)}ms` : "—"}
				</span>
			</div>
			<div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
				{mutation.isPending && (
					<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs animate-pulse">
						Searching...
					</div>
				)}
				{mutation.isError && (
					<div className="text-red-600 font-mono text-xs p-3 border border-red-300">
						{mutation.error.message}
					</div>
				)}
				{!mutation.isPending && !mutation.isError && results.length === 0 && (
					<div className="flex items-center justify-center py-10 text-muted font-mono uppercase text-xs">
						Run a query to see results
					</div>
				)}
				{strategyType === "cognee" &&
					results.length > 0 &&
					!mutation.isPending && (
						<div className="text-[10px] font-mono p-3 border border-ink border-dashed mb-2 flex items-center justify-center">
							[Graph View Only in Explore Mode]
						</div>
					)}
				{strategyType === "hippo" &&
					results.length > 0 &&
					!mutation.isPending && (
						<div className="text-[10px] font-mono p-3 border border-ink border-dashed mb-2 flex items-center justify-center">
							[Multi-Hop Diagram Only in Explore Mode]
						</div>
					)}
				{results.map((result, idx) =>
					renderCard(
						result,
						idx,
						strategyType as "text" | "hybrid" | "semantic", // Type cast for card rendering assuming same shape
						handleSelectChunk,
						usePrimaryScore,
					),
				)}
			</div>
		</div>
	);

	return (
		<main className="flex flex-1 overflow-hidden">
			{/* ── Sidebar ─────────────────────────────────── */}
			<aside className="w-[260px] min-w-[260px] flex flex-col border-r border-ink bg-white h-full overflow-y-auto">
				<div className="p-5 border-b border-ink">
					<h1 className="text-xl font-black tracking-tight leading-none mb-0.5 uppercase">
						CALIBRATION
					</h1>
					<p className="text-xs text-muted font-mono uppercase tracking-wide">
						A/B/C Retrieval Testing
					</p>
				</div>

				{/* View Toggle */}
				<div className="p-4 border-b border-ink">
					<div className="flex border border-ink bg-surface p-1">
						<button
							type="button"
							onClick={() => setViewMode("explore")}
							className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
								viewMode === "explore"
									? "bg-white text-ink shadow-[2px_2px_0px_#000] border border-ink"
									: "text-muted hover:text-ink hover:bg-white/50 border border-transparent"
							}`}
						>
							Explore
						</button>
						<button
							type="button"
							onClick={() => setViewMode("compare")}
							className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
								viewMode === "compare"
									? "bg-white text-ink shadow-[2px_2px_0px_#000] border border-ink"
									: "text-muted hover:text-ink hover:bg-white/50 border border-transparent"
							}`}
						>
							Compare
						</button>
					</div>
				</div>

				{/* Presets (Explore mode only) */}
				{viewMode === "explore" && (
					<div className="p-4 border-b border-ink bg-surface/30">
						<div className="text-[10px] font-bold uppercase tracking-widest text-ink mb-3">
							Quick Presets
						</div>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => handlePresetClick("fast")}
								className="text-left px-2 py-1.5 border border-ink hover:bg-ink hover:text-white transition-colors group relative overflow-hidden"
							>
								<div className="text-[10px] font-bold uppercase tracking-wide">
									Fast
								</div>
								<div className="text-[9px] font-mono text-ink/60 group-hover:text-white/70">
									BM25 / Top 10
								</div>
							</button>
							<button
								type="button"
								onClick={() => handlePresetClick("balanced")}
								className="text-left px-2 py-1.5 border border-ink hover:bg-ink hover:text-white transition-colors group relative overflow-hidden"
							>
								<div className="text-[10px] font-bold uppercase tracking-wide">
									Balanced
								</div>
								<div className="text-[9px] font-mono text-ink/60 group-hover:text-white/70">
									Hybrid / Top 25
								</div>
							</button>
							<button
								type="button"
								onClick={() => handlePresetClick("thorough")}
								className="text-left px-2 py-1.5 border border-ink hover:bg-ink hover:text-white transition-colors group relative overflow-hidden"
							>
								<div className="text-[10px] font-bold uppercase tracking-wide">
									Thorough
								</div>
								<div className="text-[9px] font-mono text-ink/60 group-hover:text-white/70">
									Rank / Dedup / Context
								</div>
							</button>
							<button
								type="button"
								onClick={() => handlePresetClick("graphrag")}
								className="text-left px-2 py-1.5 border border-ink bg-orange-50 hover:bg-[#FF3300] hover:border-[#FF3300] hover:text-white transition-colors group relative overflow-hidden"
							>
								<div className="text-[10px] font-bold uppercase tracking-wide">
									GraphRAG
								</div>
								<div className="text-[9px] font-mono text-ink/60 group-hover:text-white/70">
									Hippo 3-Hop
								</div>
							</button>
						</div>
					</div>
				)}

				<div className="flex-1 flex flex-col p-5 gap-6 overflow-y-auto">
					{/* Query */}
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center">
							<div className="text-xs font-bold uppercase tracking-wide text-ink flex gap-2 items-center">
								Search Query
								<span className="text-primary font-mono tracking-tighter">
									REQ
								</span>
							</div>
							<ClassificationBadge
								type={classification.type}
								confidence={classification.conf}
							/>
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

					{/* View dependent parameters */}
					{viewMode === "compare" ? (
						<>
							{/* Hybrid section */}
							<div className="flex flex-col gap-4 pt-4 border-t border-ink border-dashed">
								<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
									Strategy B · Hybrid
								</div>

								{/* Vector Weight */}
								<div
									className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}
								>
									<div className="flex justify-between items-baseline">
										<div className="text-xs font-bold uppercase">
											Vector Weight
										</div>
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
								<div
									className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}
								>
									<div className="flex justify-between items-baseline">
										<div className="text-xs font-bold uppercase">
											Text Weight
										</div>
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
										<div className="text-xs font-bold uppercase">
											Min Similarity
										</div>
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
									<div className="text-xs font-bold uppercase">
										Fusion Method
									</div>
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
									<div className="text-xs font-bold uppercase">
										Entity Filter
									</div>
									<input
										className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
										placeholder="e.g. Microsoft..."
										value={entityFilter}
										onChange={(e) => setEntityFilter(e.target.value)}
									/>
								</div>
							</div>
						</>
					) : (
						<div className="flex flex-col gap-4 pt-4 border-t border-ink border-dashed text-sm text-ink/70">
							{activeTab === "text" && (
								<p>
									Basic BM25 Text Search configuration. Only standard Top K
									configuration applies.
								</p>
							)}
							{activeTab === "hybrid" && (
								<>
									{/* Copy Hybrid Configuration here */}
									{/* Min Similarity */}
									<div className="flex flex-col gap-2">
										<div className="flex justify-between items-baseline">
											<div className="text-xs font-bold uppercase">
												Min Similarity
											</div>
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
										<div className="text-xs font-bold uppercase">
											Fusion Method
										</div>
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
									{/* Vector and Text Weights */}
									<div
										className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}
									>
										<div className="flex justify-between items-baseline">
											<div className="text-xs font-bold uppercase">
												Vector Weight
											</div>
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
											onChange={(e) =>
												handleVectorChange(Number(e.target.value))
											}
										/>
									</div>
									<div
										className={`flex flex-col gap-1.5 ${isRrf ? "opacity-40" : ""}`}
									>
										<div className="flex justify-between items-baseline">
											<div className="text-xs font-bold uppercase">
												Text Weight
											</div>
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
								</>
							)}
							{activeTab === "semantic" && (
								<>
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
										<div className="text-xs font-bold uppercase">
											Entity Filter
										</div>
										<input
											className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
											placeholder="e.g. Microsoft..."
											value={entityFilter}
											onChange={(e) => setEntityFilter(e.target.value)}
										/>
									</div>
								</>
							)}
							{activeTab === "cognee" && (
								<>
									<div className="flex flex-col gap-2">
										<div className="text-xs font-bold uppercase">Strategy</div>
										<div className="flex border border-ink">
											<button
												type="button"
												className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${cogneeStrategy === "vector" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
												onClick={() => setCogneeStrategy("vector")}
											>
												Vector
											</button>
											<button
												type="button"
												className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide border-l border-ink transition-colors ${cogneeStrategy === "graph" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
												onClick={() => setCogneeStrategy("graph")}
											>
												Graph
											</button>
											<button
												type="button"
												className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide border-l border-ink transition-colors ${cogneeStrategy === "hybrid" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
												onClick={() => setCogneeStrategy("hybrid")}
											>
												Hybrid
											</button>
										</div>
									</div>

									<div className="flex flex-col gap-1.5 pt-2">
										<div className="text-xs font-bold uppercase">
											Dataset (Optional)
										</div>
										<input
											className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
											placeholder="Dataset Name..."
											value={graphDataset}
											onChange={(e) => setGraphDataset(e.target.value)}
										/>
									</div>
								</>
							)}
							{activeTab === "hippo" && (
								<>
									<div className="flex flex-col gap-1.5 pb-4">
										<div className="text-xs font-bold uppercase">
											Dataset (Optional)
										</div>
										<input
											className="w-full p-2 text-xs font-mono bg-white border border-ink focus:border-primary focus:ring-0 placeholder-muted"
											placeholder="Dataset Name..."
											value={graphDataset}
											onChange={(e) => setGraphDataset(e.target.value)}
										/>
									</div>
									<div className="text-xs text-ink/70 pt-4 border-t border-ink border-dashed">
										<p>
											HippoRAG automatically determines the optimal multi-hop
											paths.
										</p>
										<p className="mt-2 text-[10px] uppercase tracking-wide font-bold">
											No Manual Tuning Required
										</p>
									</div>
								</>
							)}
						</div>
					)}
				</div>

				{/* Run button */}
				<div className="p-0 mt-auto border-t border-ink bg-white sticky bottom-0 z-20">
					<button
						type="button"
						className="w-full h-12 bg-ink text-white font-bold text-sm hover:bg-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
						disabled={!query.trim() || isRunning}
						onClick={handleRunQuery}
					>
						<span className="material-symbols-outlined text-[18px]">
							{isRunning ? "hourglass_empty" : "play_arrow"}
						</span>
						{isRunning
							? "Running..."
							: viewMode === "compare"
								? "Run All Strategies"
								: "Run Query"}
					</button>
				</div>
			</aside>

			{/* ── Main results area ────────────────────────── */}
			<section className="flex-1 flex flex-col h-full overflow-hidden bg-surface relative">
				{viewMode === "explore" ? (
					<div className="flex flex-col h-full">
						{/* Tab Headers */}
						<div className="flex border-b border-ink bg-white overflow-x-auto">
							{[
								{ id: "text", label: "Text (BM25)" },
								{ id: "hybrid", label: "Hybrid" },
								{ id: "semantic", label: "Semantic" },
								{ id: "cognee", label: "Cognee GraphRAG" },
								{ id: "hippo", label: "HippoRAG" },
							].map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id as ActiveTab)}
									className={`px-6 py-3 border-r border-ink text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
										activeTab === tab.id
											? "bg-ink text-white"
											: "hover:bg-surface/50 text-ink/70 hover:text-ink cursor-pointer"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Tab Content */}
						<div className="flex-1 flex w-full h-full overflow-hidden relative">
							{activeTab === "text" &&
								renderResultsColumn(
									"Text",
									"BM25",
									textMutation,
									textResults,
									"text",
									textLatency,
									"bg-white",
									false,
								)}
							{activeTab === "hybrid" &&
								renderResultsColumn(
									"Hybrid",
									`${isRrf ? "RRF" : `V${effectiveVW}/T${effectiveTW}`}`,
									hybridMutation,
									hybridResults,
									"hybrid",
									hybridLatency,
									"bg-surface/50",
									true,
								)}
							{activeTab === "semantic" &&
								renderResultsColumn(
									"Semantic",
									enableReranking ? "RERANK" : "",
									semanticMutation,
									semanticResults,
									"semantic",
									semanticLatency,
									"bg-white",
									false,
								)}
							{(activeTab === "cognee" || activeTab === "hippo") && (
								<>
									<div className="flex-1 flex items-center justify-center bg-white border-r border-ink">
										{activeTab === "cognee" ? (
											<GraphNetworkViewer
												isLoading={cogneeMutation.isPending}
												entities={
													cogneeMutation.data?.results?.flatMap(
														(r) => r.entities || [],
													) || []
												}
											/>
										) : (
											<MultiHopPathDiagram
												isLoading={hippoMutation.isPending}
												entities={
													hippoMutation.data?.results?.[0]?.entities || []
												}
											/>
										)}
									</div>
									{activeTab === "cognee"
										? renderResultsColumn(
												"Cognee",
												cogneeStrategy.toUpperCase(),
												cogneeMutation,
												cogneeResults,
												"cognee",
												cogneeLatency,
												"bg-surface/50",
												false,
											)
										: renderResultsColumn(
												"HippoRAG",
												"MULTI-HOP",
												hippoMutation,
												hippoResults,
												"hippo",
												hippoLatency,
												"bg-surface/50",
												false,
											)}
								</>
							)}
						</div>
					</div>
				) : (
					/* Compare View (Original 3 columns) */
					<div className="flex-1 flex flex-col w-full h-full overflow-hidden">
						<div className="flex-1 grid grid-cols-3 overflow-hidden h-full min-h-0">
							{[compareCol1, compareCol2, compareCol3].map(
								(colStrategy, index) => {
									let title = "";
									let subtitle = "";
									// biome-ignore lint/suspicious/noExplicitAny: Allows multiple types of mutation hooks
									let mutation: any;
									// biome-ignore lint/suspicious/noExplicitAny: Allows multiple types of results arrays
									let results: any[] = [];
									let latency: number | undefined;
									let usePrimaryScore = false;

									if (colStrategy === "text") {
										title = "Text";
										subtitle = "BM25";
										mutation = textMutation;
										results = textResults;
										latency = textLatency;
									} else if (colStrategy === "hybrid") {
										title = "Hybrid";
										subtitle = `${isRrf ? "RRF" : `V${effectiveVW}/T${effectiveTW}`}`;
										mutation = hybridMutation;
										results = hybridResults;
										latency = hybridLatency;
										usePrimaryScore = true;
									} else if (colStrategy === "semantic") {
										title = "Semantic";
										subtitle = enableReranking ? "RERANK" : "";
										mutation = semanticMutation;
										results = semanticResults;
										latency = semanticLatency;
									} else if (colStrategy === "cognee") {
										title = "Cognee";
										subtitle = cogneeStrategy.toUpperCase();
										mutation = cogneeMutation;
										results = cogneeResults;
										latency = cogneeLatency;
									} else if (colStrategy === "hippo") {
										title = "HippoRAG";
										subtitle = `PPR M-HOP`;
										mutation = hippoMutation;
										results = hippoResults;
										latency = hippoLatency;
									}

									return renderResultsColumn(
										title,
										subtitle,
										mutation,
										results,
										colStrategy,
										latency,
										index % 2 === 0 ? "bg-white" : "bg-surface/50",
										usePrimaryScore,
										renderCompareSelector(
											colStrategy,
											index === 0
												? setCompareCol1
												: index === 1
													? setCompareCol2
													: setCompareCol3,
										),
										`compare-${index}`,
									);
								},
							)}
						</div>
					</div>
				)}

				{/* ── RAG Query Panel ──────────────────────── */}
				<div className="flex-none border-t border-ink bg-white z-20">
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
							<span className="text-[9px] font-mono text-muted uppercase border border-ink px-1.5 py-0.5 hidden sm:inline-block">
								/api/v1/rag/query
							</span>
						</div>
						{ragMutation.data && (
							<span className="text-[9px] font-mono text-muted hidden sm:inline-block">
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
							<div className="flex items-end gap-4 overflow-x-auto pb-2">
								<div className="flex flex-col gap-1.5 min-w-max">
									<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
										Strategy Preset
									</div>
									<div className="flex border border-ink">
										{(
											["auto", "fast", "balanced", "thorough"] as RagStrategy[]
										).map((s) => (
											<button
												key={s}
												type="button"
												className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors border-r border-ink last:border-r-0 ${ragStrategy === s ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
												onClick={() => setRagStrategy(s)}
											>
												{s}
											</button>
										))}
									</div>
								</div>
								<button
									type="button"
									className="h-9 px-6 bg-ink text-white font-bold text-xs hover:bg-primary transition-colors flex items-center gap-2 uppercase tracking-wide disabled:opacity-50 shrink-0"
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
												{
													label: "Latency",
													value: `${Math.round(ragMutation.data.metrics.latency_ms)}ms`,
												},
												{
													label: "Tokens",
													value: ragMutation.data.metrics.tokens_used,
												},
												{
													label: "Retrieval Score",
													value:
														ragMutation.data.metrics.retrieval_score?.toFixed(
															3,
														),
												},
												{
													label: "Chunks Used",
													value: `${ragMutation.data.metrics.chunks_used}/${ragMutation.data.metrics.chunks_retrieved}`,
												},
											].map(({ label, value }) => (
												<div
													key={label}
													className="flex flex-col border-l-2 border-ink pl-2"
												>
													<span className="text-[8px] text-muted font-mono uppercase">
														{label}
													</span>
													<span className="font-bold font-mono text-xs">
														{value}
													</span>
												</div>
											))}
											{ragMutation.data.query_type && (
												<div className="flex flex-col border-l-2 border-ink pl-2">
													<span className="text-[8px] text-muted font-mono uppercase">
														Query Type
													</span>
													<span className="font-bold font-mono text-xs uppercase">
														{ragMutation.data.query_type}
													</span>
												</div>
											)}
										</div>
									)}

									{/* Sources */}
									{ragMutation.data.sources &&
										ragMutation.data.sources.length > 0 && (
											<div className="flex flex-col gap-2">
												<div className="text-[9px] font-bold uppercase tracking-widest text-muted">
													Sources ({ragMutation.data.sources.length})
												</div>
												<div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
													{ragMutation.data.sources.map((src, i) => (
														<div
															key={src.chunk_id ?? `rag-src-${i}`}
															className="flex gap-3 items-start p-2 border border-ink/30 bg-surface/20"
														>
															<span className="font-mono text-[9px] bg-ink text-white px-1 py-0.5 shrink-0">
																{src.similarity_score?.toFixed(3) ??
																	`#${i + 1}`}
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
			{selectedChunk && (
				<ChunkDetailPanel
					result={selectedChunk.result}
					strategy={
						selectedChunk.strategy === "text" ||
						selectedChunk.strategy === "hybrid" ||
						selectedChunk.strategy === "semantic"
							? selectedChunk.strategy
							: "hybrid" // fallback
					}
					query={query}
					isOpen={selectedChunk != null}
					onClose={() => setSelectedChunk(null)}
				/>
			)}
		</main>
	);
}
