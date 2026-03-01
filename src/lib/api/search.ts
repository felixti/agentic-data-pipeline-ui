import { apiClient } from "./client";
import type { components } from "./schema";

export type HybridSearchRequest = components["schemas"]["HybridSearchRequest"];
export type SemanticSearchRequest =
	components["schemas"]["SemanticSearchRequest"];
export type TextSearchRequest = components["schemas"]["TextSearchRequest"];

/* ── Inline types for endpoints not yet in generated schema ── */

export interface SemanticTextSearchRequest {
	query: string;
	top_k?: number;
	min_similarity?: number;
	filters?: Record<string, string>;
}

export interface SemanticTextSearchResultItem {
	chunk_id: string;
	job_id: string;
	chunk_index: number;
	content: string;
	metadata?: Record<string, unknown>;
	similarity_score: number;
	rank: number;
}

export interface SemanticTextSearchResponse {
	results?: SemanticTextSearchResultItem[];
	total: number;
	query_time_ms: number;
}

export interface RAGQueryRequest {
	query: string;
	strategy?: "auto" | "fast" | "balanced" | "thorough";
	context?: Record<string, unknown>;
	filters?: Record<string, unknown>;
	top_k?: number;
}

export interface RAGSource {
	chunk_id: string;
	job_id: string;
	content: string;
	similarity_score: number;
	rank: number;
	metadata?: Record<string, unknown>;
}

export interface RAGQueryResponse {
	answer: string;
	sources?: RAGSource[];
	query_id?: string;
	strategy_used?: string;
	query_type?: string;
	metrics?: {
		latency_ms: number;
		tokens_used: number;
		retrieval_score: number;
		classification_confidence: number;
		chunks_retrieved: number;
		chunks_used: number;
	};
}

/* ── Cognee Types ────────────────────────────────────────── */

export interface CogneeSearchRequest {
	query: string;
	search_type?: "vector" | "graph" | "hybrid";
	top_k?: number;
	dataset_id?: string;
}

export interface CogneeSearchResult {
	chunk_id: string;
	content: string;
	score: number;
	source_document: string;
	entities: string[];
}

export interface CogneeSearchResponse {
	results: CogneeSearchResult[];
	search_type: string;
	dataset_id: string;
	query_time_ms: number;
}

/* ── HippoRAG Types ──────────────────────────────────────── */

export interface HippoRAGRetrieveRequest {
	queries: string[];
	dataset_id?: string;
	num_to_retrieve?: number;
	include_metadata?: boolean;
}

export interface HippoRAGRetrievalResult {
	query: string;
	passages: string[];
	scores: number[];
	source_documents: string[];
	entities: string[];
}

export interface HippoRAGRetrieveResponse {
	results: HippoRAGRetrievalResult[];
	query_time_ms: number;
}

export interface HippoRAGQARequest {
	queries: string[];
	dataset_id?: string;
	num_to_retrieve?: number;
	generate_answer?: boolean;
}

export interface HippoRAGQAResult {
	query: string;
	answer: string;
	sources: string[];
	confidence: number;
	retrieval_results: HippoRAGRetrievalResult;
}

export interface HippoRAGQAResponse {
	results: HippoRAGQAResult[];
	total_tokens: number;
	query_time_ms: number;
}

/* ── Helper for authenticated fetch calls ─────────────── */

function getApiKey(): string {
	return typeof window !== "undefined"
		? (localStorage.getItem("ag_api_key") ?? "")
		: "";
}

async function apiFetch<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`/proxy${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-Key": getApiKey(),
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		let msg = `Request failed (${res.status})`;
		try {
			const err = await res.json();
			const detail = err?.detail;
			if (Array.isArray(detail)) msg = detail[0]?.msg ?? msg;
			else if (typeof detail === "string") msg = detail;
			else if (err?.message) msg = err.message;
		} catch {
			// ignore
		}
		throw new Error(msg);
	}
	return res.json() as Promise<T>;
}

/* ── Search Functions ────────────────────────────────── */

export async function hybridSearch(params: HybridSearchRequest) {
	const { data, error } = await apiClient.POST("/api/v1/search/hybrid", {
		body: params,
	});
	if (error) {
		const detail = (error as { detail?: unknown })?.detail;
		const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
		throw new Error(msg || "Failed to execute hybrid search");
	}
	return data;
}

export async function semanticSearch(params: SemanticSearchRequest) {
	const { data, error } = await apiClient.POST("/api/v1/search/semantic", {
		body: params,
	});
	if (error) {
		const detail = (error as { detail?: unknown })?.detail;
		const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
		throw new Error(msg || "Failed to execute semantic search");
	}
	return data;
}

export async function semanticTextSearch(
	params: SemanticTextSearchRequest,
): Promise<SemanticTextSearchResponse> {
	return apiFetch<SemanticTextSearchResponse>(
		"/api/v1/search/semantic/text",
		params,
	);
}

export async function textSearch(params: TextSearchRequest) {
	const { data, error } = await apiClient.POST("/api/v1/search/text", {
		body: params,
	});
	if (error) {
		const detail = (error as { detail?: unknown })?.detail;
		const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
		throw new Error(msg || "Failed to execute text search");
	}
	return data;
}

export async function ragQuery(
	params: RAGQueryRequest,
): Promise<RAGQueryResponse> {
	return apiFetch<RAGQueryResponse>("/api/v1/rag/query", params);
}

export async function cogneeSearch(
	params: CogneeSearchRequest,
): Promise<CogneeSearchResponse> {
	return apiFetch<CogneeSearchResponse>("/api/v1/cognee/search", params);
}

export async function hipporagRetrieve(
	params: HippoRAGRetrieveRequest,
): Promise<HippoRAGRetrieveResponse> {
	return apiFetch<HippoRAGRetrieveResponse>(
		"/api/v1/hipporag/retrieve",
		params,
	);
}

export async function hipporagQA(
	params: HippoRAGQARequest,
): Promise<HippoRAGQAResponse> {
	return apiFetch<HippoRAGQAResponse>("/api/v1/hipporag/qa", params);
}

export async function findSimilarChunks(
	chunkId: string,
	params?: { top_k?: number; exclude_self?: boolean },
) {
	const { data, error } = await apiClient.GET(
		"/api/v1/search/similar/{chunk_id}",
		{
			params: {
				path: { chunk_id: chunkId },
				query: { top_k: params?.top_k, exclude_self: params?.exclude_self },
			},
		},
	);
	if (error) {
		const detail = (error as { detail?: unknown })?.detail;
		const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
		throw new Error(msg || "Failed to find similar chunks");
	}
	return data;
}

export async function listJobChunks(
	jobId: string,
	params?: { limit?: number; offset?: number; include_embedding?: boolean },
) {
	const { data, error } = await apiClient.GET("/api/v1/jobs/{job_id}/chunks", {
		params: {
			path: { job_id: jobId },
			query: {
				limit: params?.limit,
				offset: params?.offset,
			},
		},
	});
	if (error) {
		const detail = (error as any)?.detail;
		const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
		throw new Error(msg || "Failed to retrieve job chunks");
	}
	return data;
}
