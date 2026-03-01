import type { SemanticTextSearchResultItem } from "@/lib/api/search";

export interface SearchResult {
	chunk_id?: string;
	id?: string;
	chunk_index?: number;
	job_id?: string;
	rank?: number;
	content?: string;
	text?: string;
	highlighted_content?: string;
	similarity_score?: number;
	text_score?: number;
	vector_score?: number;
	hybrid_score?: number;
	fusion_method?: string;
	matched_terms?: string[];
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

const getScore = (
	result: SearchResult,
	strategy: "text" | "hybrid" | "semantic",
) => {
	if (strategy === "hybrid") return result.hybrid_score ?? result.score ?? null;
	return result.similarity_score ?? result.score ?? null;
};

const getSourceName = (result: SearchResult) => {
	if (result?.content_source_name) return result.content_source_name;
	const m = result?.metadata;
	if (!m) return null;
	return (
		m.file_name ??
		m.filename ??
		m.source ??
		m.source_file ??
		m.document_name ??
		null
	);
};

export const renderCard = (
	result: SearchResult,
	idx: number,
	strategy: "text" | "hybrid" | "semantic",
	onSelect: (r: SearchResult, strategy: "text" | "hybrid" | "semantic") => void,
	usePrimaryScore = false,
) => {
	const score = getScore(result, strategy);
	const source = getSourceName(result);
	return (
		<button
			key={idx}
			type="button"
			className={`w-full text-left border border-ink bg-white p-4 flex flex-col gap-3 cursor-pointer hover:border-primary hover:shadow-[2px_2px_0px_#ff4400] transition-all ${idx > 2 && strategy === "text" ? "opacity-50 hover:opacity-100" : ""}`}
			onClick={() => onSelect(result, strategy)}
		>
			<div className="flex justify-between items-baseline">
				<span
					className={`font-mono text-xs px-1.5 py-0.5 ${strategy === "semantic" ? "bg-ink text-white" : usePrimaryScore ? "bg-primary text-white" : "bg-ink text-white"}`}
					style={strategy === "semantic" ? { background: "#1a1a2e" } : {}}
				>
					{score != null ? score.toFixed(3) : "—"}
				</span>
				<span className="font-mono text-[9px] text-muted uppercase">
					{strategy === "semantic"
						? `RANK ${(result as SemanticTextSearchResultItem).rank ?? idx + 1}`
						: `ID ${result.chunk_id?.substring(0, 8) ?? result.id?.substring(0, 8) ?? `#${idx + 1}`}`}
				</span>
			</div>
			{result.highlighted_content ? (
				<p
					className="text-sm leading-snug font-display line-clamp-4 [&_mark]:bg-primary/20 [&_mark]:text-ink [&_mark]:font-bold [&_mark]:px-0.5"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted HTML from backend highlight
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
