"use client";

import { useState } from "react";
import { useJobChunks, useJobs, useVectorHealth } from "@/lib/api/hooks";

export default function VectorInspector() {
	const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
	const [selectedChunk, setSelectedChunk] = useState<any>(null);
	const [page, setPage] = useState(0);
	const limit = 20;

	const {
		data: healthData,
		isLoading: healthLoading,
		error: healthError,
	} = useVectorHealth();
	const { data: jobsData } = useJobs({
		limit: 50,
		sort_by: "created_at",
		sort_order: "desc",
	});
	const {
		data: chunksData,
		isLoading: chunksLoading,
		error: chunksError,
	} = useJobChunks(selectedJobId, { limit, offset: page * limit });

	const chunks =
		(chunksData as any)?.items ??
		(chunksData as any)?.chunks ??
		(Array.isArray(chunksData) ? chunksData : []);
	const totalChunks = (chunksData as any)?.total ?? chunks.length;

	return (
		<main className="flex-1 flex flex-col overflow-hidden max-w-[1920px] mx-auto w-full border-x border-black relative">
			<div className="px-6 py-8 border-b border-black flex justify-between items-end bg-white relative z-10">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-widest">
						<span>Database</span>
						<span className="material-symbols-outlined text-[10px]">
							chevron_right
						</span>
						<span>Vector Store</span>
						<span className="material-symbols-outlined text-[10px]">
							chevron_right
						</span>
						<span className="text-primary">Chunks</span>
					</div>
					<h1 className="text-5xl font-black tracking-tight uppercase leading-none mt-2">
						03 Vector Inspector
					</h1>
					<p className="text-sm text-muted mt-1 max-w-2xl font-medium">
						Browse ingestion job chunks. Select a job to inspect its vector
						embeddings and metadata.
					</p>
				</div>
				<div className="flex gap-4">
					<div className="flex flex-col items-end">
						<span className="text-[10px] font-mono text-muted uppercase mb-1">
							Total Chunks
						</span>
						<span className="text-xl font-mono font-bold">
							{selectedJobId ? totalChunks : "—"}
						</span>
					</div>
					<div className="w-px h-full bg-black mx-2"></div>
					<div className="flex flex-col items-end">
						<span className="text-[10px] font-mono text-muted uppercase mb-1">
							Jobs Available
						</span>
						<span className="text-xl font-mono font-bold">
							{jobsData?.total ?? "—"}
						</span>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-12 border-b-4 border-black bg-white relative z-10">
				<div className="col-span-6 border-r border-black p-4 flex flex-col gap-1 hover:bg-surface group transition-colors">
					<label
						className="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-black transition-colors"
						htmlFor="job_select"
					>
						Select Ingestion Job
					</label>
					<div className="flex items-center relative">
						<span className="material-symbols-outlined text-base mr-2 text-muted group-focus-within:text-primary transition-colors">
							work_outline
						</span>
						<select
							className="w-full bg-transparent border-b border-gray-300 focus:border-primary p-0 text-sm font-mono h-6 appearance-none pr-6 cursor-pointer transition-colors focus:shadow-none focus:ring-0"
							id="job_select"
							value={selectedJobId ?? ""}
							onChange={(e) => {
								setSelectedJobId(e.target.value || undefined);
								setSelectedChunk(null);
								setPage(0);
							}}
						>
							<option value="">Choose a job...</option>
							{jobsData?.items?.map((job) => (
								<option key={job.id} value={job.id}>
									{job.id.substring(0, 8)}… — {job.source_type} ({job.status})
									{job.file_name ? ` — ${job.file_name}` : ""}
								</option>
							))}
						</select>
						<span className="material-symbols-outlined text-sm absolute right-0 pointer-events-none group-focus-within:text-primary transition-colors">
							arrow_drop_down
						</span>
					</div>
				</div>

				<div className="col-span-4 border-r border-black p-4 flex flex-col gap-1">
					<span className="text-[10px] font-bold uppercase tracking-widest text-muted">
						Status
					</span>
					<div className="flex items-center gap-2 h-6">
						{selectedJobId ? (
							<>
								<span
									className={`size-2 ${chunksLoading ? "bg-yellow-500 animate-pulse" : chunksError ? "bg-red-500" : "bg-green-500"}`}
								></span>
								<span className="font-mono text-sm">
									{chunksLoading
										? "Loading..."
										: chunksError
											? "Error"
											: `${totalChunks} chunks`}
								</span>
							</>
						) : (
							<span className="font-mono text-sm text-muted">
								No job selected
							</span>
						)}
					</div>
				</div>

				<div className="col-span-2 p-0 flex items-end justify-end bg-black text-white hover:bg-primary cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(255,68,0,0.3)] active:translate-y-0 active:shadow-none">
					<button
						type="button"
						className="w-full h-full p-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
						disabled={!selectedJobId}
						onClick={() => {
							setPage(0);
							setSelectedChunk(null);
						}}
					>
						<span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform duration-300">
							refresh
						</span>
						Reload
					</button>
				</div>
			</div>

			<div className="h-1 w-full bg-white relative overflow-hidden border-b border-black">
				<div className="absolute inset-0 bg-transparent"></div>
			</div>

			<div className="flex-1 overflow-auto bg-white relative">
				<table className="w-full border-collapse table-fixed">
					<thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,1)]">
						<tr className="h-10 border-b border-black">
							<th className="w-12 border-r border-black p-0 text-center border-b"></th>
							<th className="w-48 border-r border-black px-3 text-left text-[10px] font-bold uppercase tracking-widest text-black border-b">
								Chunk ID
							</th>
							<th className="w-auto border-r border-black px-3 text-left text-[10px] font-bold uppercase tracking-widest text-black border-b">
								Content Preview
							</th>
							<th className="w-24 border-r border-black px-3 text-right text-[10px] font-bold uppercase tracking-widest text-black border-b">
								Tokens
							</th>
							<th className="w-40 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-black border-b">
								Created At
							</th>
						</tr>
					</thead>
					<tbody className="font-mono text-xs divide-black">
						{!selectedJobId && (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-16 text-center text-muted font-mono uppercase"
								>
									Select a job above to browse its chunks
								</td>
							</tr>
						)}
						{selectedJobId && chunksLoading && (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-16 text-center text-muted font-mono uppercase"
								>
									<span className="animate-pulse">Loading chunks...</span>
								</td>
							</tr>
						)}
						{selectedJobId && chunksError && (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-16 text-center text-red-600 font-mono"
								>
									Failed to load chunks: {(chunksError as Error).message}
								</td>
							</tr>
						)}
						{chunks.map((chunk: any) => {
							const isSelected =
								selectedChunk?.id === chunk.id ||
								selectedChunk?.chunk_id === chunk.chunk_id;
							const chunkId = chunk.chunk_id ?? chunk.id ?? "—";
							const text = chunk.text ?? chunk.content ?? "—";
							const tokenCount = chunk.token_count ?? chunk.tokens ?? "—";

							return (
								<tr
									key={chunkId}
									className={`h-8 cursor-pointer transition-all duration-200 relative border-b border-black hover:border-transparent hover:z-10 hover:shadow-[0_2px_0px_#000] hover:-translate-y-0.5 ${isSelected ? "bg-surface border-l-4 border-primary shadow-[0_2px_0px_#000] -translate-y-0.5 z-10" : "hover:bg-surface group/row"}`}
									onClick={() => setSelectedChunk(chunk)}
								>
									<td
										className={`border-r border-black text-center h-8 transition-colors ${isSelected ? "bg-primary/10" : "group-hover/row:bg-primary/10"}`}
									>
										<div className="w-full h-full flex items-center justify-center">
											{isSelected ? (
												<span className="material-symbols-outlined text-[16px] text-primary">
													check
												</span>
											) : (
												<span className="material-symbols-outlined text-[16px] opacity-0 group-hover/row:opacity-100 transition-opacity">
													arrow_right
												</span>
											)}
										</div>
									</td>
									<td
										className={`border-r border-black px-3 truncate select-all h-8 ${isSelected ? "font-bold text-ink" : "text-ink font-bold"}`}
									>
										{typeof chunkId === "string"
											? chunkId.substring(0, 12)
											: chunkId}
									</td>
									<td
										className={`border-r border-black px-3 truncate h-8 ${isSelected ? "text-ink font-bold" : "text-muted group-hover/row:text-ink"}`}
									>
										{typeof text === "string" ? text.substring(0, 120) : "—"}
									</td>
									<td className="border-r border-black px-3 text-right text-ink h-8">
										{tokenCount}
									</td>
									<td className="px-3 text-ink h-8">
										{chunk.created_at
											? new Date(chunk.created_at).toLocaleString()
											: "—"}
									</td>
								</tr>
							);
						})}
						{selectedJobId &&
							!chunksLoading &&
							!chunksError &&
							chunks.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-16 text-center text-muted font-mono uppercase"
									>
										No chunks found for this job.
									</td>
								</tr>
							)}
					</tbody>
				</table>
			</div>

			<div className="h-12 border-t-4 border-black bg-white flex justify-between items-center px-6 relative z-10">
				<div className="flex items-center gap-2 group cursor-help relative">
					<div
						className={`size-2 ${healthData?.status === "healthy" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
					></div>
					<span
						className={`text-xs font-bold uppercase tracking-widest transition-colors ${healthData?.status === "healthy" ? "text-black group-hover:text-green-600" : "text-black group-hover:text-red-600"}`}
					>
						{healthLoading
							? "Connecting..."
							: healthError
								? "Connection Failed"
								: "Live Connection"}
					</span>
					<div className="absolute left-0 bottom-full mb-2 bg-black text-white text-[10px] p-2 font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
						{healthError
							? (healthError as Error).message
							: healthData?.message || "Connected to vector store"}
					</div>
				</div>
				<div className="flex items-center divide-x divide-black border border-black">
					<button
						type="button"
						className="h-8 px-4 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn active:scale-95 bg-white"
						disabled={page === 0}
						onClick={() => setPage((p) => Math.max(0, p - 1))}
					>
						<span className="material-symbols-outlined text-sm group-hover/btn:-translate-x-1 transition-transform">
							chevron_left
						</span>
						<span className="text-xs font-bold ml-1">PREV</span>
					</button>
					<div className="h-8 px-4 flex items-center justify-center bg-surface font-mono text-xs font-bold cursor-default select-none">
						<span className="text-primary">{page + 1}</span>
						<span className="mx-1 text-muted">/</span>
						<span>{totalChunks > 0 ? Math.ceil(totalChunks / limit) : 1}</span>
					</div>
					<button
						type="button"
						className="h-8 px-4 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 group/btn bg-white active:scale-95 disabled:opacity-50"
						disabled={(page + 1) * limit >= totalChunks}
						onClick={() => setPage((p) => p + 1)}
					>
						<span className="text-xs font-bold mr-1">NEXT</span>
						<span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
							chevron_right
						</span>
					</button>
				</div>
			</div>

			{selectedChunk && (
				<aside className="absolute top-[88px] right-0 bottom-0 w-[480px] bg-white border-l-4 border-black shadow-none flex flex-col z-30">
					<div className="flex items-center justify-between p-4 border-b-4 border-black bg-white">
						<div className="flex items-center gap-3">
							<div className="size-8 bg-black text-white flex items-center justify-center">
								<span className="material-symbols-outlined text-lg">
									data_object
								</span>
							</div>
							<div>
								<h3 className="text-lg font-bold uppercase leading-none">
									Chunk Details
								</h3>
								<p className="text-[10px] font-mono text-muted mt-1">
									ID:{" "}
									{(selectedChunk.chunk_id ?? selectedChunk.id ?? "—")
										.toString()
										.substring(0, 16)}
								</p>
							</div>
						</div>
						<button
							type="button"
							className="hover:bg-black hover:text-white p-2 border border-transparent hover:border-black transition-colors group/close"
							onClick={() => setSelectedChunk(null)}
						>
							<span className="material-symbols-outlined group-hover/close:rotate-90 transition-transform">
								close
							</span>
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-0">
						<div className="p-4 border-b border-black">
							<h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
								<span className="material-symbols-outlined text-sm">info</span>
								Metadata
							</h4>
							<div className="bg-white border border-black p-4 font-mono text-xs">
								<div className="grid grid-cols-2 gap-y-2">
									{selectedChunk.metadata &&
										Object.entries(selectedChunk.metadata).map(
											([key, value]) => (
												<div key={key} className="contents">
													<span className="text-muted">{key}:</span>
													<span className="text-right text-ink truncate">
														{typeof value === "object"
															? JSON.stringify(value)
															: String(value)}
													</span>
												</div>
											),
										)}
									{selectedChunk.token_count && (
										<>
											<span className="text-muted">Tokens:</span>
											<span className="text-right text-ink">
												{selectedChunk.token_count}
											</span>
										</>
									)}
									{selectedChunk.created_at && (
										<>
											<span className="text-muted">Created:</span>
											<span className="text-right text-ink">
												{new Date(selectedChunk.created_at).toLocaleString()}
											</span>
										</>
									)}
								</div>
							</div>
						</div>

						<div className="p-4 border-b border-black">
							<h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
								<span className="material-symbols-outlined text-sm">
									description
								</span>
								Text Content
							</h4>
							<div className="bg-white border border-black p-4 font-mono text-xs leading-relaxed h-48 overflow-y-auto selection:bg-primary selection:text-white group/content hover:border-primary transition-colors cursor-text">
								{selectedChunk.text ??
									selectedChunk.content ??
									"No text content available"}
							</div>
						</div>

						{selectedChunk.embedding && (
							<div className="p-4 mb-20">
								<div className="flex items-center justify-between mb-3">
									<h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
										<span className="material-symbols-outlined text-sm">
											scatter_plot
										</span>
										Vector Array
									</h4>
									<span className="text-[10px] bg-black text-white px-1 font-mono">
										{Array.isArray(selectedChunk.embedding)
											? selectedChunk.embedding.length
											: "?"}{" "}
										dims
									</span>
								</div>
								<div className="bg-black text-white p-4 font-mono text-[10px] leading-tight break-all h-64 overflow-y-auto border border-black selection:bg-primary selection:text-white hover:shadow-[inset_0_0_20px_rgba(255,68,0,0.1)] transition-shadow cursor-text">
									<span className="opacity-50 hover:opacity-100 transition-opacity">
										[
										{Array.isArray(selectedChunk.embedding)
											? selectedChunk.embedding
													.slice(0, 50)
													.map((v: number) => v.toFixed(4))
													.join(", ") +
												(selectedChunk.embedding.length > 50 ? ", ..." : "")
											: "—"}
										]
									</span>
								</div>
							</div>
						)}
					</div>
				</aside>
			)}
		</main>
	);
}
