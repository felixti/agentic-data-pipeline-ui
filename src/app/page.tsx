"use client";

import { useState } from "react";
import NewJobPanel from "@/components/NewJobPanel";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import {
	useHealth,
	useJobs,
	useCancelJob,
	useDeleteJobHard,
	useBulkDeleteJobs,
} from "@/lib/api/hooks";

type DeleteTarget = {
	id: string;
	fileName?: string;
	mode: "soft" | "hard";
};

const ACTIVE_STATUSES = new Set(["created", "queued", "processing"]);

export default function Monitor() {
	const {
		data: jobsData,
		isLoading: jobsLoading,
		error: jobsError,
	} = useJobs({ limit: 20, sort_by: "created_at", sort_order: "desc" });
	const { data: healthData, isLoading: healthLoading } = useHealth();

	const cancelJob = useCancelJob();
	const deleteHard = useDeleteJobHard();
	const bulkDelete = useBulkDeleteJobs();

	const [jobPanelOpen, setJobPanelOpen] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
	const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

	const handleCopy = (id: string, e: React.SyntheticEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(id);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	/* ── Selection helpers ─────────────────────────────── */
	const allIds = jobsData?.items?.map((j) => j.id) ?? [];
	const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
	const someSelected = selectedIds.size > 0;

	const toggleAll = () => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(allIds));
		}
	};

	const toggleRow = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	/* ── Delete handlers ───────────────────────────────── */
	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setSingleDeleteError(null);
		try {
			if (deleteTarget.mode === "soft") {
				await cancelJob.mutateAsync(deleteTarget.id);
			} else {
				await deleteHard.mutateAsync(deleteTarget.id);
			}
			setDeleteTarget(null);
		} catch (err) {
			setSingleDeleteError(
				err instanceof Error ? err.message : "An unexpected error occurred",
			);
		}
	};

	const handleConfirmBulkDelete = async () => {
		const ids = Array.from(selectedIds);
		setBulkDeleteError(null);
		try {
			await bulkDelete.mutateAsync({ job_ids: ids });
			setSelectedIds(new Set());
			setBulkDeleteOpen(false);
		} catch (err) {
			setBulkDeleteError(
				err instanceof Error ? err.message : "An unexpected error occurred",
			);
		}
	};

	const isDeletePending =
		cancelJob.isPending || deleteHard.isPending;

	/* ── Health ─────────────────────────────────────────── */
	const components = healthData?.components ?? {};
	const isOverallHealthy = healthData?.overall_healthy ?? false;

	return (
		<main className="flex-1 flex flex-col overflow-hidden relative">
			{/* ── Stat cards ─────────────────────────────────── */}
			<section className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b-4 border-ink divide-y md:divide-y-0 md:divide-x divide-ink bg-white">
				<div className="p-6 flex flex-col justify-between h-44 group hover:bg-surface transition-all duration-300 border-r border-ink hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] z-10 hover:z-20 relative bg-white">
					<div className="flex justify-between items-start">
						<h3 className="font-bold text-[11px] tracking-widest text-ink uppercase">
							Total Jobs
						</h3>
						<span className="material-symbols-outlined text-signal text-sm opacity-0 group-hover:opacity-100 transition-opacity">
							work
						</span>
					</div>
					<div className="mt-auto">
						<div className="font-mono text-[48px] leading-none font-medium tracking-tighter text-ink transition-transform duration-300 origin-left group-hover:scale-105">
							{jobsLoading ? "—" : (jobsData?.total ?? 0)}
						</div>
						<div className="flex items-center gap-1 text-ink font-mono text-[10px] uppercase mt-2">
							<span className="material-symbols-outlined text-[12px]">
								database
							</span>
							<span>INDEXED JOBS</span>
						</div>
					</div>
				</div>

				<div className="p-6 flex flex-col justify-between h-44 group hover:bg-surface transition-all duration-300 border-r border-ink hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] z-10 hover:z-20 relative bg-white">
					<div className="flex justify-between items-start">
						<h3 className="font-bold text-[11px] tracking-widest text-ink uppercase">
							System Status
						</h3>
						<span className="material-symbols-outlined text-signal text-sm opacity-0 group-hover:opacity-100 transition-opacity">
							speed
						</span>
					</div>
					<div className="mt-auto">
						<div className="font-mono text-[48px] leading-none font-medium tracking-tighter text-ink transition-transform duration-300 origin-left group-hover:scale-105">
							{healthLoading ? "—" : (healthData?.status ?? "—")}
						</div>
						<div className="flex items-center gap-1 text-ink font-mono text-[10px] uppercase mt-2">
							<span
								className={`material-symbols-outlined text-[12px] ${isOverallHealthy ? "text-green-600" : "text-red-600"}`}
							>
								{isOverallHealthy ? "check_circle" : "error"}
							</span>
							<span>{healthData?.environment ?? "UNKNOWN"}</span>
						</div>
					</div>
				</div>

				<div className="p-6 flex flex-col justify-between h-44 group hover:bg-surface transition-all duration-300 border-r border-ink hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] z-10 hover:z-20 relative bg-white">
					<div className="flex justify-between items-start">
						<h3 className="font-bold text-[11px] tracking-widest text-ink uppercase">
							Components
						</h3>
						<span className="material-symbols-outlined text-signal text-sm opacity-0 group-hover:opacity-100 transition-opacity">
							memory
						</span>
					</div>
					<div className="mt-auto">
						<div className="font-mono text-[48px] leading-none font-medium tracking-tighter text-ink transition-transform duration-300 origin-left group-hover:scale-105">
							{healthLoading ? "—" : Object.keys(components).length}
						</div>
						<div className="flex items-center gap-1 text-ink font-mono text-[10px] uppercase mt-2">
							<span className="material-symbols-outlined text-[12px]">hub</span>
							<span>
								{healthLoading
									? "LOADING"
									: `${Object.values(components).filter((c) => c.status === "healthy").length} HEALTHY`}
							</span>
						</div>
					</div>
				</div>

				<div className="p-6 flex flex-col justify-between h-44 group hover:bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] z-10 hover:z-20 relative bg-white border-r md:border-r-0 border-ink">
					<div className="flex justify-between items-start">
						<h3 className="font-bold text-[11px] tracking-widest text-ink uppercase">
							Version
						</h3>
						<span className="material-symbols-outlined text-signal text-sm opacity-0 group-hover:opacity-100 transition-opacity">
							info
						</span>
					</div>
					<div className="mt-auto">
						<div className="font-mono text-[36px] leading-none font-medium tracking-tighter text-ink transition-transform duration-300 origin-left group-hover:scale-105">
							{healthLoading ? "—" : (healthData?.version ?? "—")}
						</div>
						<div className="flex items-center gap-1 text-ink font-mono text-[10px] uppercase mt-2">
							<span className="material-symbols-outlined text-[12px]">
								schedule
							</span>
							<span>
								{healthData?.timestamp
									? new Date(healthData.timestamp).toLocaleTimeString()
									: "—"}
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* ── Job table section ───────────────────────────── */}
			<section className="flex-1 flex flex-col bg-white overflow-hidden relative">
				{/* Toolbar */}
				<div className="flex-none bg-white border-b border-ink flex items-center justify-between px-6 py-3">
					<h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
						<span
							className={`w-3 h-3 ${jobsLoading ? "bg-yellow-500" : jobsError ? "bg-red-500" : "bg-signal"} animate-pulse`}
						></span>
						Active Job Queue
					</h2>
					<div className="flex items-center gap-3 text-xs font-mono">
						<span className="px-2 py-1 uppercase text-ink/50">
							{jobsData?.total ?? 0} TOTAL
						</span>

						{/* Bulk delete button — appears when rows are selected */}
						{someSelected && (
							<button
								type="button"
								onClick={() => setBulkDeleteOpen(true)}
								className="flex items-center gap-2 px-4 h-9 font-bold text-[11px] tracking-widest uppercase text-white border-2 border-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none translate-y-[-2px] mb-2 hover:opacity-90 transition-all cursor-pointer"
								style={{ backgroundColor: "#FF4D00" }}
							>
								<span className="material-symbols-outlined text-[14px]">
									delete_sweep
								</span>
								BULK DELETE ({selectedIds.size})
							</button>
						)}

						<button
							type="button"
							onClick={() => setJobPanelOpen(true)}
							style={{ backgroundColor: "#FF4D00", color: "#FFFFFF" }}
							className="flex-none w-[140px] h-9 font-bold text-[11px] tracking-widest uppercase hover:opacity-90 transition-all cursor-pointer border-2 border-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none flex items-center justify-center translate-y-[-2px] mb-2"
						>
							NEW JOB
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="flex-1 overflow-auto w-full">
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead className="bg-white sticky top-0 z-10 font-bold text-xs uppercase tracking-wider border-b border-ink shadow-sm">
							<tr>
								{/* Checkbox column */}
								<th className="px-4 py-3 border-r border-ink w-10">
									<input
										type="checkbox"
										aria-label="Select all jobs"
										checked={allSelected}
										onChange={toggleAll}
										className="w-4 h-4 accent-ink cursor-pointer"
									/>
								</th>
								<th className="px-6 py-3 border-r border-ink w-64">Job ID</th>
								<th className="px-6 py-3 border-r border-ink w-48">Source</th>
								<th className="px-6 py-3 border-r border-ink w-48">Status</th>
								<th className="px-6 py-3 border-r border-ink w-48">File Name</th>
								<th className="px-6 py-3 border-r border-ink w-48">Created</th>
								<th className="px-6 py-3 w-36 text-center">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-ink font-mono text-sm relative">
							{jobsLoading && (
								<tr>
									<td colSpan={7} className="px-6 py-12 text-center text-muted">
										<span className="animate-pulse">Loading jobs...</span>
									</td>
								</tr>
							)}
							{jobsError && (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-12 text-center text-red-600"
									>
										{(jobsError as Error)?.message ||
											"Failed to load jobs. Check your API key in Configuration."}
									</td>
								</tr>
							)}
							{jobsData?.items?.map((job) => {
								const statusColor =
									job.status === "completed"
										? "text-green-700"
										: job.status === "failed"
											? "text-signal font-bold"
											: job.status === "processing"
												? "text-ink font-bold"
												: job.status === "created"
													? "text-blue-600 font-bold"
													: "text-ink/40";

								const isActive = ACTIVE_STATUSES.has(job.status);
								const isSelected = selectedIds.has(job.id);

								return (
									<tr
										key={job.id}
										className={`group hover:bg-surface cursor-crosshair-custom transition-all duration-200 h-12 relative hover:z-10 hover:shadow-[0_4px_0px_#000] hover:-translate-y-0.5 border-b border-transparent hover:border-ink ${
											job.status === "failed" ? "bg-surface hover:bg-red-50" : ""
										} ${isSelected ? "bg-surface/60" : ""}`}
									>
										{/* Checkbox */}
										<td className="px-4 py-3 border-r border-ink">
											<input
												type="checkbox"
												aria-label={`Select job ${job.id}`}
												checked={isSelected}
												onChange={() => toggleRow(job.id)}
												onClick={(e) => e.stopPropagation()}
												className="w-4 h-4 accent-ink cursor-pointer"
											/>
										</td>

										{/* Job ID */}
										<td
											className="px-6 py-3 border-r border-ink font-bold group-hover:text-signal transition-colors cursor-pointer"
											title={`Click to copy: ${job.id}`}
											onClick={(e) => handleCopy(job.id, e)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handleCopy(job.id, e);
												}
											}}
										>
											{copiedId === job.id ? (
												<span className="text-green-600">COPIED!</span>
											) : (
												<>{job.id.substring(0, 8)}…</>
											)}
										</td>

										<td className="px-6 py-3 border-r border-ink uppercase">
											{job.source_type ?? "—"}
										</td>
										<td
											className={`px-6 py-3 border-r border-ink ${statusColor} uppercase`}
										>
											{job.status}
											{(job.status === "processing" ||
												job.status === "created") && (
												<span className="animate-blink">_</span>
											)}
										</td>
										<td
											className="px-6 py-3 border-r border-ink text-ink/70"
											title={job.file_name ?? undefined}
										>
											{job.file_name ?? "—"}
										</td>
										<td className="px-6 py-3 border-r border-ink text-ink/70">
											{new Date(job.created_at).toLocaleString()}
										</td>

										{/* Actions */}
										<td className="px-3 py-2 text-center">
											<div className="flex items-center justify-center gap-1">
												{/* Soft cancel — only for active jobs */}
												{isActive && (
													<button
														type="button"
														title="Cancel job (soft)"
														onClick={(e) => {
															e.stopPropagation();
															setDeleteTarget({
																id: job.id,
																fileName: job.file_name,
																mode: "soft",
															});
														}}
														className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-widest uppercase border border-ink hover:bg-amber-50 hover:border-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
													>
														<span className="material-symbols-outlined text-[13px]">
															cancel
														</span>
														CANCEL
													</button>
												)}

												{/* Hard delete — always visible */}
												<button
													type="button"
													title="Permanently delete job and all chunks"
													onClick={(e) => {
														e.stopPropagation();
														setDeleteTarget({
															id: job.id,
															fileName: job.file_name,
															mode: "hard",
														});
													}}
													className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-widest uppercase border border-ink hover:bg-signal hover:border-signal hover:text-white transition-colors cursor-pointer"
												>
													<span className="material-symbols-outlined text-[13px]">
														delete_forever
													</span>
													DELETE
												</button>
											</div>
										</td>
									</tr>
								);
							})}
							{!jobsLoading &&
								!jobsError &&
								(!jobsData?.items || jobsData.items.length === 0) && (
									<tr>
										<td
											colSpan={7}
											className="px-6 py-12 text-center text-muted"
										>
											No jobs found.
										</td>
									</tr>
								)}
						</tbody>
					</table>
				</div>
			</section>

			{/* ── Marquee footer ──────────────────────────────── */}
			<footer className="flex-none h-8 bg-ink text-white font-mono text-xs flex items-center overflow-hidden whitespace-nowrap border-t-4 border-ink">
				<div className="flex animate-marquee">
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">
						[SYSTEM] Connected to {healthData?.environment ?? "production"}
					</span>
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">
						[HEALTH] Status: {healthData?.status ?? "checking..."}
					</span>
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">[VERSION] {healthData?.version ?? "—"}</span>
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">
						[JOBS] {jobsData?.total ?? 0} total jobs indexed
					</span>
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">
						[SYSTEM] Connected to {healthData?.environment ?? "production"}
					</span>
					<span className="mx-4 text-signal">●</span>
					<span className="mr-8">
						[HEALTH] Status: {healthData?.status ?? "checking..."}
					</span>
				</div>
			</footer>

			{/* ── Panels & Modals ─────────────────────────────── */}
			<NewJobPanel
				isOpen={jobPanelOpen}
				onClose={() => setJobPanelOpen(false)}
			/>

			{/* Single-job confirmation modal */}
			<DeleteConfirmModal
				isOpen={!!deleteTarget}
				onClose={() => { setDeleteTarget(null); setSingleDeleteError(null); }}
				onConfirm={handleConfirmDelete}
				isPending={isDeletePending}
				variant={deleteTarget?.mode === "hard" ? "danger" : "warning"}
				error={singleDeleteError}
				title={
					deleteTarget?.mode === "hard"
						? "PERMANENTLY DELETE JOB?"
						: "CANCEL JOB?"
				}
				description={
					deleteTarget?.mode === "hard"
						? `Job ${deleteTarget?.id.substring(0, 8)}… ${deleteTarget?.fileName ? `(${deleteTarget.fileName})` : ""} and ALL associated chunks will be permanently removed from the system.`
						: `Job ${deleteTarget?.id.substring(0, 8)}… will be cancelled. The job record will remain but processing will stop. You can retry a cancelled job later.`
				}
				confirmLabel={deleteTarget?.mode === "hard" ? "DELETE FOREVER" : "YES, CANCEL"}
			/>

			{/* Bulk delete confirmation modal */}
			<DeleteConfirmModal
				isOpen={bulkDeleteOpen}
				onClose={() => { setBulkDeleteOpen(false); setBulkDeleteError(null); }}
				onConfirm={handleConfirmBulkDelete}
				isPending={bulkDelete.isPending}
				variant="danger"
				error={bulkDeleteError}
				title={`DELETE ${selectedIds.size} JOBS?`}
				description={`${selectedIds.size} selected job${selectedIds.size !== 1 ? "s" : ""} and ALL their associated chunks will be permanently deleted. This cannot be undone.`}
				confirmLabel={`DELETE ${selectedIds.size} JOBS`}
			/>
		</main>
	);
}
