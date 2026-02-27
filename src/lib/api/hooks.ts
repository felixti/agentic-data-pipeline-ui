import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";
import { hybridSearch, ragQuery, semanticTextSearch, textSearch } from "./search";

export type ComprehensiveHealthResponse =
	components["schemas"]["ComprehensiveHealthResponse"];

/* ── Jobs ─────────────────────────────────────────────── */

export function useJobs(params?: {
	page?: number;
	limit?: number;
	status?: string;
	sort_by?: string;
	sort_order?: string;
}) {
	const query = useQuery({
		queryKey: ["jobs", params],
		queryFn: async () => {
			const { data, error } = await apiClient.GET("/api/v1/jobs", {
				params: { query: params },
			});
			if (error) {
				const errObj = error as Record<string, unknown>;
				const status = (errObj?.status ?? errObj?.statusCode) as number | undefined;
				const detail = errObj?.detail?.toString() ?? errObj?.message?.toString();
				const prefix = status ? `Server error (${status})` : "Failed to fetch jobs";
				throw new Error(detail || prefix);
			}
			// API returns envelope: { data: { items, total, page, page_size }, meta, links }
			const envelope = data as Record<string, unknown>;
			const inner = (envelope?.data ?? envelope) as Record<string, unknown>;
			return {
				items: (inner.items ?? []) as Array<{
					id: string;
					status: string;
					source_type: string;
					created_at: string;
					updated_at: string;
					file_name?: string;
					config?: Record<string, unknown>;
					error_message?: string;
					[key: string]: unknown;
				}>,
				total: (inner.total ?? 0) as number,
				page: (inner.page ?? 1) as number,
				limit: ((inner.page_size ?? inner.limit ?? 20) as number),
			};
		},
		refetchInterval: (query) => {
			const items = query.state.data?.items;
			const hasActive = items?.some(
				(j) => ["created", "pending", "queued", "processing"].includes(j.status),
			);
			return hasActive ? 3_000 : 30_000;
		},
	});
	return query;
}

/* ── Health (Comprehensive) ──────────────────────────── */

export function useHealth() {
	return useQuery({
		queryKey: ["health"],
		queryFn: async () => {
			const { data, error } = await apiClient.GET("/health");
			if (error) throw new Error("Failed to fetch health");
			return data;
		},
		refetchInterval: 30_000,
	});
}

/* ── Vector Store Health ─────────────────────────────── */

export function useVectorHealth() {
	return useQuery({
		queryKey: ["vector-health"],
		queryFn: async () => {
			const { data, error } = await apiClient.GET("/health/vector");
			if (error) throw new Error("Failed to fetch vector health");
			return data;
		},
	});
}

/* ── Job Chunks ──────────────────────────────────────── */

export function useJobChunks(
	jobId: string | undefined,
	params?: { limit?: number; offset?: number },
) {
	return useQuery({
		queryKey: ["job-chunks", jobId, params],
		queryFn: async () => {
			if (!jobId) throw new Error("No job ID");
			const { data, error } = await apiClient.GET(
				"/api/v1/jobs/{job_id}/chunks",
				{
					params: {
						path: { job_id: jobId },
						query: { limit: params?.limit, offset: params?.offset },
					},
				},
			);
			if (error) throw new Error("Failed to fetch chunks");
			return data;
		},
		enabled: !!jobId,
	});
}

/* ── Search Mutations (for Calibration) ──────────────── */

export function useTextSearch() {
	return useMutation({ mutationFn: textSearch });
}

export function useHybridSearch() {
	return useMutation({ mutationFn: hybridSearch });
}

export function useSemanticTextSearch() {
	return useMutation({ mutationFn: semanticTextSearch });
}

export function useRagQuery() {
	return useMutation({ mutationFn: ragQuery });
}

/* ── Job Creation Mutations ──────────────────────────── */

export interface CreateJobRequest {
	source_type: "upload" | "url" | "s3" | "azure_blob" | "sharepoint";
	source_uri: string;
	file_name?: string;
	file_size?: number;
	mime_type?: string;
	priority?: "low" | "normal" | "high";
	mode?: "sync" | "async";
	external_id?: string;
	pipeline_id?: string;
	destination_ids?: string[];
	metadata?: Record<string, unknown>;
}

export interface JobResponse {
	data: {
		id: string;
		status: string;
		source_type: string;
		source_uri: string;
		file_name?: string;
		file_size?: number;
		mime_type?: string | null;
		priority: number;
		mode: string;
		external_id?: string | null;
		retry_count: number;
		max_retries: number;
		created_at: string;
		updated_at: string;
		started_at?: string | null;
		completed_at?: string | null;
		error?: string | null;
	};
	meta: {
		request_id: string;
		timestamp: string;
		api_version: string;
	};
}

export function useCreateJob() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateJobRequest) => {
			const { data, error } = await apiClient.POST("/api/v1/jobs", {
				body: body as any,
			});
			if (error) {
				const errDetail = error as Record<string, unknown>;
				const detail = errDetail?.detail;
				// Handle structured error response
				if (typeof detail === "object" && detail !== null) {
					const errorObj = detail as Record<string, unknown>;
					const msg =
						(errorObj.error as Record<string, string>)?.message ??
						(errorObj.message as string) ??
						JSON.stringify(detail);
					throw new Error(msg);
				}
				throw new Error(
					(detail as string) ||
					errDetail?.message?.toString() ||
					"Failed to create job",
				);
			}
			return data as unknown as JobResponse;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
	});
}

export interface UploadFilesRequest {
	files: File[];
	priority?: "low" | "normal" | "high";
	pipeline_id?: string;
	destination_ids?: string[];
	metadata?: Record<string, unknown>;
}

export interface UploadFilesResponse {
	data: {
		jobs: Array<{
			id: string;
			status: string;
			source_type: string;
			source_uri: string;
			file_name?: string;
			file_size?: number;
			mime_type?: string | null;
			priority: number;
			created_at: string;
		}>;
		total: number;
	};
	meta: {
		request_id: string;
		timestamp: string;
		api_version: string;
	};
}

export function useUploadFiles() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (
			params: UploadFilesRequest,
		): Promise<UploadFilesResponse> => {
			const formData = new FormData();

			// Append each file with proper metadata
			for (const file of params.files) {
				formData.append("files", file);
			}

			// Add optional parameters
			if (params.priority) {
				formData.append("priority", params.priority);
			}
			if (params.pipeline_id) {
				formData.append("pipeline_id", params.pipeline_id);
			}
			if (params.destination_ids?.length) {
				formData.append(
					"destination_ids",
					JSON.stringify(params.destination_ids),
				);
			}
			if (params.metadata) {
				formData.append("metadata", JSON.stringify(params.metadata));
			}

			const apiKey =
				typeof window !== "undefined"
					? (localStorage.getItem("ag_api_key") ?? "")
					: "";

			const res = await fetch("/proxy/api/v1/upload", {
				method: "POST",
				headers: {
					"X-API-Key": apiKey,
					// Note: Do NOT set Content-Type for FormData - browser sets it with boundary
				},
				body: formData,
			});

			if (!res.ok) {
				let errorMessage = `Upload failed (${res.status})`;
				try {
					const err = await res.json();
					// Handle different error response structures
					if (err.error?.message) {
						errorMessage = err.error.message;
					} else if (err.detail?.error?.message) {
						errorMessage = err.detail.error.message;
					} else if (err.detail?.message) {
						errorMessage = err.detail.message;
					} else if (typeof err.detail === "string") {
						errorMessage = err.detail;
					} else if (err.message) {
						errorMessage = err.message;
					}
				} catch {
					// If JSON parsing fails, use status text
					errorMessage = `Upload failed: ${res.statusText || res.status}`;
				}
				throw new Error(errorMessage);
			}

			const data = await res.json();
			return data as UploadFilesResponse;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["jobs"] });
		},
		retry: (failureCount, error) => {
			// Retry on network errors or 5xx server errors
			if (error instanceof Error) {
				const msg = error.message.toLowerCase();
				if (
					msg.includes("network") ||
					msg.includes("timeout") ||
					msg.includes("failed to fetch")
				) {
					return failureCount < 3;
				}
			}
			return false;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
	});
}

export interface IngestUrlRequest {
	url: string;
	filename?: string;
	priority?: "low" | "normal" | "high";
	mode?: "sync" | "async";
	external_id?: string;
	headers?: Record<string, string>;
	pipeline_id?: string;
	destination_ids?: string[];
	metadata?: Record<string, unknown>;
}

export function useIngestUrl() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: IngestUrlRequest): Promise<JobResponse> => {
			const apiKey =
				typeof window !== "undefined"
					? (localStorage.getItem("ag_api_key") ?? "")
					: "";

			const res = await fetch("/proxy/api/v1/upload/url", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": apiKey,
				},
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				let errorMessage = `URL ingestion failed (${res.status})`;
				try {
					const err = await res.json();
					if (err.error?.message) {
						errorMessage = err.error.message;
					} else if (err.detail?.error?.message) {
						errorMessage = err.detail.error.message;
					} else if (err.detail?.message) {
						errorMessage = err.detail.message;
					} else if (typeof err.detail === "string") {
						errorMessage = err.detail;
					} else if (err.message) {
						errorMessage = err.message;
					}
				} catch {
					errorMessage = `URL ingestion failed: ${res.statusText || res.status}`;
				}
				throw new Error(errorMessage);
			}
			return res.json() as Promise<JobResponse>;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
		retry: (failureCount, error) => {
			if (error instanceof Error) {
				const msg = error.message.toLowerCase();
				if (
					msg.includes("network") ||
					msg.includes("timeout") ||
					msg.includes("failed to fetch")
				) {
					return failureCount < 3;
				}
			}
			return false;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
	});
}

/* ── Cancel Job (Soft) ───────────────────────────────── */

export function useCancelJob() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (jobId: string) => {
			const apiKey =
				typeof window !== "undefined"
					? (localStorage.getItem("ag_api_key") ?? "")
					: "";
			const res = await fetch(`/proxy/api/v1/jobs/${jobId}`, {
				method: "DELETE",
				headers: { "X-API-Key": apiKey },
			});
			if (!res.ok && res.status !== 204) {
				let msg = `Cancel failed (${res.status})`;
				try {
					const err = await res.json();
					msg = err?.error?.message ?? err?.message ?? msg;
				} catch {
					// ignore
				}
				throw new Error(msg);
			}
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
	});
}

/* ── Hard Delete Job + Chunks ────────────────────────── */

export function useDeleteJobHard() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (jobId: string) => {
			const apiKey =
				typeof window !== "undefined"
					? (localStorage.getItem("ag_api_key") ?? "")
					: "";
			const res = await fetch(`/proxy/api/v1/jobs/${jobId}/hard`, {
				method: "DELETE",
				headers: { "X-API-Key": apiKey },
			});
			if (!res.ok && res.status !== 204) {
				let msg = `Delete failed (${res.status})`;
				try {
					const err = await res.json();
					msg = err?.error?.message ?? err?.message ?? msg;
				} catch {
					// ignore
				}
				throw new Error(msg);
			}
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
	});
}

/* ── Bulk Delete Jobs ────────────────────────────────── */

export interface BulkDeleteRequest {
	job_ids: string[];
	dry_run?: boolean;
}

export interface BulkDeleteResult {
	data: {
		summary: {
			total_requested: number;
			jobs_deleted: number;
			jobs_not_found: number;
			jobs_failed: number;
			total_chunks_deleted: number;
			dry_run: boolean;
		};
		details: {
			deleted: Array<{ job_id: string; file_name: string; chunks: number }>;
			not_found: string[];
			failed: Array<{ job_id: string; error: string }>;
		};
	};
}

export function useBulkDeleteJobs() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: BulkDeleteRequest): Promise<BulkDeleteResult> => {
			const apiKey =
				typeof window !== "undefined"
					? (localStorage.getItem("ag_api_key") ?? "")
					: "";
			const res = await fetch("/proxy/api/v1/jobs/bulk-delete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": apiKey,
				},
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				let msg = `Bulk delete failed (${res.status})`;
				try {
					const err = await res.json();
					msg = err?.error?.message ?? err?.message ?? msg;
				} catch {
					// ignore
				}
				throw new Error(msg);
			}
			return res.json() as Promise<BulkDeleteResult>;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
	});
}
