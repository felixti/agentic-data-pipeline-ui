"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "@/components/providers/config-provider";
import {
	type CreateJobRequest,
	type IngestUrlRequest,
	type UploadFilesRequest,
	type JobDestination,
	useCreateJob,
	useIngestUrl,
	useUploadFiles,
} from "@/lib/api/hooks";

type Tab = "upload" | "url" | "manual";

const SOURCE_TYPES = [
	{ value: "upload", label: "Upload" },
	{ value: "url", label: "URL" },
	{ value: "s3", label: "Amazon S3" },
	{ value: "azure_blob", label: "Azure Blob" },
	{ value: "sharepoint", label: "SharePoint" },
] as const;

const PRIORITIES = [
	{ value: "low", label: "Low" },
	{ value: "normal", label: "Normal" },
	{ value: "high", label: "High" },
] as const;

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewJobPanel({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const [tab, setTab] = useState<Tab>("upload");
	const [closing, setClosing] = useState(false);

	/* ── Upload Tab State ──────────────────────────── */
	const [files, setFiles] = useState<File[]>([]);
	const [dragOver, setDragOver] = useState(false);
	const [uploadPriority, setUploadPriority] = useState<
		"low" | "normal" | "high"
	>("normal");
	const fileInputRef = useRef<HTMLInputElement>(null);

	/* ── URL Tab State ─────────────────────────────── */
	const [url, setUrl] = useState("");
	const [urlFilename, setUrlFilename] = useState("");
	const [urlPriority, setUrlPriority] = useState<"low" | "normal" | "high">(
		"normal",
	);

	/* ── Manual Tab State ──────────────────────────── */
	const [sourceType, setSourceType] = useState<
		"upload" | "url" | "s3" | "azure_blob" | "sharepoint"
	>("s3");
	const [sourceUri, setSourceUri] = useState("");
	const [manualFilename, setManualFilename] = useState("");
	const [manualPriority, setManualPriority] = useState<
		"low" | "normal" | "high"
	>("normal");
	const [metadataJson, setMetadataJson] = useState("");

	/* ── Advanced Parameters State ─────────────────── */
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [advStrategy, setAdvStrategy] = useState<
		"fixed" | "recursive" | "semantic" | ""
	>("");
	const [advChunkSize, setAdvChunkSize] = useState<string>("");
	const [advOverlap, setAdvOverlap] = useState<string>("");

	/* ── Destinations State (GraphRAG) ─────────────── */
	const [enableCognee, setEnableCognee] = useState(false);
	const [cogneeDataset, setCogneeDataset] = useState("");
	const [cogneeGraph, setCogneeGraph] = useState("");
	const [cogneeAutoCognify, setCogneeAutoCognify] = useState(true);
	const [cogneeEntities, setCogneeEntities] = useState(true);
	const [cogneeRelations, setCogneeRelations] = useState(true);

	const [enableHipporag, setEnableHipporag] = useState(false);
	const [hipporagDataset, setHipporagDataset] = useState("");

	/* ── Global Config Context ─────────────────────── */
	const { strategy, chunkSize, overlap } = useConfig();

	/* ── Mutations ─────────────────────────────────── */
	const uploadMutation = useUploadFiles();
	const urlMutation = useIngestUrl();
	const manualMutation = useCreateJob();

	const activeMutation =
		tab === "upload"
			? uploadMutation
			: tab === "url"
				? urlMutation
				: manualMutation;

	/* ── Success Message ───────────────────────────── */
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	/* ── Close animation ───────────────────────────── */
	const handleClose = useCallback(() => {
		setClosing(true);
		setTimeout(() => {
			setClosing(false);
			setSuccessMsg(null);
			onClose();
		}, 250);
	}, [onClose]);

	/* Escape key */
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isOpen, handleClose]);

	/* ── Reset on close ────────────────────────────── */
	useEffect(() => {
		if (!isOpen) {
			setFiles([]);
			setUrl("");
			setUrlFilename("");
			setSourceUri("");
			setManualFilename("");
			setMetadataJson("");
			setSuccessMsg(null);
			setAdvancedOpen(false);
			setAdvStrategy("");
			setAdvChunkSize("");
			setAdvOverlap("");
			setEnableCognee(false);
			setCogneeDataset("");
			setCogneeGraph("");
			setCogneeEntities(true);
			setCogneeRelations(true);
			setEnableHipporag(false);
			setHipporagDataset("");
			uploadMutation.reset();
			urlMutation.reset();
			manualMutation.reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	/* ── File Handling ─────────────────────────────── */
	const addFiles = (incoming: FileList | File[]) => {
		const arr = Array.from(incoming);
		setFiles((prev) => [...prev, ...arr]);
	};

	const removeFile = (idx: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
	};

	/* ── Submit ─────────────────────────────────────── */
	const handleSubmit = async () => {
		try {
			// Helper to merge advanced metadata
			const buildMetadata = (base?: Record<string, unknown>) => {
				const advanced: Record<string, unknown> = {};

				advanced.chunk_strategy = advStrategy || strategy;
				advanced.chunk_size = advChunkSize
					? parseInt(advChunkSize, 10)
					: chunkSize;
				advanced.chunk_overlap = advOverlap
					? parseInt(advOverlap, 10)
					: overlap;

				if (Object.keys(advanced).length === 0 && !base) return undefined;
				return { ...base, ...advanced };
			};

			const buildDestinations = (): JobDestination[] | undefined => {
				const dests: JobDestination[] = [];
				if (enableCognee) {
					dests.push({
						type: "cognee_local",
						config: {
							dataset_id: cogneeDataset.trim() || "default",
							graph_name: cogneeGraph.trim() || "default",
							auto_cognify: cogneeAutoCognify,
							extract_entities: cogneeEntities,
							extract_relationships: cogneeRelations,
						},
						enabled: true,
					});
				}
				if (enableHipporag) {
					dests.push({
						type: "hipporag",
						config: {
							dataset_id: hipporagDataset.trim() || "default",
						},
						enabled: true,
					});
				}
				const result = dests.length > 0 ? dests : undefined;
				console.log("[NewJobPanel] Generated destinations:", result);
				return result;
			};

			if (tab === "upload") {
				if (!files.length) return;
				await uploadMutation.mutateAsync({
					files,
					priority: uploadPriority,
					destinations: buildDestinations(),
					metadata: buildMetadata(),
				});
				setSuccessMsg(
					`${files.length} file${files.length > 1 ? "s" : ""} uploaded — job${files.length > 1 ? "s" : ""} created`,
				);
			} else if (tab === "url") {
				if (!url.trim()) return;
				await urlMutation.mutateAsync({
					url: url.trim(),
					filename: urlFilename || undefined,
					priority: urlPriority,
					destinations: buildDestinations(),
					metadata: buildMetadata(),
				});
				setSuccessMsg("URL ingestion job created");
			} else {
				if (!sourceUri.trim()) return;
				let metadata: Record<string, unknown> | undefined;
				if (metadataJson.trim()) {
					try {
						metadata = JSON.parse(metadataJson);
					} catch {
						manualMutation.reset();
						throw new Error("Invalid JSON in metadata field");
					}
				}

				const finalMetadata = buildMetadata(metadata);

				await manualMutation.mutateAsync({
					source_type: sourceType,
					source_uri: sourceUri.trim(),
					file_name: manualFilename || undefined,
					priority: manualPriority,
					destinations: buildDestinations(),
					metadata: finalMetadata,
				});
				setSuccessMsg("Job created successfully");
			}
			setTimeout(handleClose, 1200);
		} catch {
			/* error is shown via mutation.error */
		}
	};

	const isSubmitting = activeMutation.isPending;
	const submitDisabled =
		isSubmitting ||
		(tab === "upload" && files.length === 0) ||
		(tab === "url" && !url.trim()) ||
		(tab === "manual" && !sourceUri.trim());

	if (!isOpen) return null;

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
					<h2 className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
						<span className="material-symbols-outlined text-lg">
							add_circle
						</span>
						New Ingestion Job
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

				{/* Tabs */}
				<nav className="flex-none flex border-b-4 border-ink bg-white">
					{(
						[
							["upload", "UPLOAD", "upload_file"],
							["url", "URL", "link"],
							["manual", "MANUAL", "tune"],
						] as const
					).map(([key, label, icon]) => (
						<button
							type="button"
							key={key}
							onClick={() => setTab(key as Tab)}
							className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer border-b-2 ${
								tab === key
									? "border-primary text-ink bg-surface"
									: "border-transparent text-muted hover:text-ink hover:bg-surface/50"
							}`}
						>
							<span className="material-symbols-outlined text-sm">{icon}</span>
							{label}
						</button>
					))}
				</nav>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* ─── UPLOAD TAB ──────────────────────────── */}
					{tab === "upload" && (
						<>
							{/* Drop Zone */}
							<div
								onDragOver={(e) => {
									e.preventDefault();
									setDragOver(true);
								}}
								onDragLeave={() => setDragOver(false)}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
								className={`border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-[160px] ${
									dragOver
										? "border-primary bg-primary/5"
										: "border-ink/30 hover:border-ink"
								}`}
							>
								<span
									className={`material-symbols-outlined text-4xl transition-colors ${dragOver ? "text-primary" : "text-muted"}`}
								>
									cloud_upload
								</span>
								<div className="text-center">
									<p className="font-bold text-xs tracking-widest uppercase text-ink">
										Drop files here
									</p>
									<p className="text-[10px] text-muted mt-1 uppercase tracking-wider">
										or click to browse
									</p>
								</div>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									className="hidden"
									onChange={(e) => {
										if (e.target.files) addFiles(e.target.files);
										e.target.value = "";
									}}
								/>
							</div>

							{/* File List */}
							{files.length > 0 && (
								<div className="border border-ink divide-y divide-ink">
									{files.map((file, idx) => (
										<div
											key={`${file.name}-${idx}`}
											className="flex items-center justify-between px-4 py-2.5 group hover:bg-surface transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												<span className="material-symbols-outlined text-sm text-muted">
													description
												</span>
												<div className="min-w-0">
													<p className="font-mono text-xs truncate">
														{file.name}
													</p>
													<p className="text-[10px] text-muted uppercase">
														{formatFileSize(file.size)}
													</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => removeFile(idx)}
												className="text-muted hover:text-signal transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
											>
												<span className="material-symbols-outlined text-sm">
													close
												</span>
											</button>
										</div>
									))}
								</div>
							)}

							{/* Priority */}
							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Priority
								</label>
								<div className="flex gap-0 border border-ink">
									{PRIORITIES.map((p) => (
										<button
											key={p.value}
											onClick={() =>
												setUploadPriority(p.value as "low" | "normal" | "high")
											}
											style={
												uploadPriority === p.value
													? { backgroundColor: "#000000", color: "#FFFFFF" }
													: {}
											}
											className={`flex-1 py-2 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer ${
												uploadPriority !== p.value
													? "bg-white text-ink hover:bg-surface"
													: ""
											}`}
										>
											{p.label}
										</button>
									))}
								</div>
							</div>
						</>
					)}

					{/* ─── URL TAB ─────────────────────────────── */}
					{tab === "url" && (
						<>
							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Document URL *
								</label>
								<input
									type="url"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://example.com/document.pdf"
									className="w-full border-b border-ink bg-transparent py-2 font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Filename Override
								</label>
								<input
									type="text"
									value={urlFilename}
									onChange={(e) => setUrlFilename(e.target.value)}
									placeholder="document.pdf"
									className="w-full border-b border-ink bg-transparent py-2 font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Priority
								</label>
								<div className="flex gap-0 border border-ink">
									{PRIORITIES.map((p) => (
										<button
											key={p.value}
											onClick={() =>
												setUrlPriority(p.value as "low" | "normal" | "high")
											}
											style={
												urlPriority === p.value
													? { backgroundColor: "#000000", color: "#FFFFFF" }
													: {}
											}
											className={`flex-1 py-2 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer ${
												urlPriority !== p.value
													? "bg-white text-ink hover:bg-surface"
													: ""
											}`}
										>
											{p.label}
										</button>
									))}
								</div>
							</div>
						</>
					)}

					{/* ─── MANUAL TAB ──────────────────────────── */}
					{tab === "manual" && (
						<>
							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Source Type *
								</label>
								<div className="flex gap-0 border border-ink flex-wrap">
									{SOURCE_TYPES.map((s) => (
										<button
											key={s.value}
											onClick={() =>
												setSourceType(
													s.value as
														| "upload"
														| "url"
														| "s3"
														| "azure_blob"
														| "sharepoint",
												)
											}
											style={
												sourceType === s.value
													? { backgroundColor: "#000000", color: "#FFFFFF" }
													: {}
											}
											className={`flex-1 min-w-[90px] py-2 font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer ${
												sourceType !== s.value
													? "bg-white text-ink hover:bg-surface"
													: ""
											}`}
										>
											{s.label}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Source URI *
								</label>
								<input
									type="text"
									value={sourceUri}
									onChange={(e) => setSourceUri(e.target.value)}
									placeholder={
										sourceType === "s3"
											? "s3://bucket/path/document.pdf"
											: sourceType === "azure_blob"
												? "https://account.blob.core.windows.net/container/doc.pdf"
												: sourceType === "sharepoint"
													? "https://company.sharepoint.com/sites/docs/file.pdf"
													: "/path/to/file"
									}
									className="w-full border-b border-ink bg-transparent py-2 font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Filename
								</label>
								<input
									type="text"
									value={manualFilename}
									onChange={(e) => setManualFilename(e.target.value)}
									placeholder="document.pdf"
									className="w-full border-b border-ink bg-transparent py-2 font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Priority
								</label>
								<div className="flex gap-0 border border-ink">
									{PRIORITIES.map((p) => (
										<button
											key={p.value}
											onClick={() =>
												setManualPriority(p.value as "low" | "normal" | "high")
											}
											style={
												manualPriority === p.value
													? { backgroundColor: "#000000", color: "#FFFFFF" }
													: {}
											}
											className={`flex-1 py-2 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer ${
												manualPriority !== p.value
													? "bg-white text-ink hover:bg-surface"
													: ""
											}`}
										>
											{p.label}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Metadata (JSON)
								</label>
								<textarea
									value={metadataJson}
									onChange={(e) => setMetadataJson(e.target.value)}
									placeholder={
										'{"department": "engineering", "project": "demo"}'
									}
									rows={3}
									className="w-full border border-ink bg-transparent p-3 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
								/>
							</div>
						</>
					)}
					{/* ─── GRAPHRAG DESTINATIONS ─────────────────────── */}
					<div className="border-t-4 border-ink pt-6 mt-6">
						<h3 className="font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
							<span className="material-symbols-outlined text-sm">hub</span>
							GraphRAG Destinations
						</h3>

						<div className="space-y-4">
							{/* Cognee Card */}
							<div className={`border-2 transition-colors ${enableCognee ? 'border-primary' : 'border-ink/20 hover:border-ink/50'}`}>
								<button
									type="button"
									onClick={() => setEnableCognee(!enableCognee)}
									className="w-full flex items-center justify-between p-4 bg-white cursor-pointer"
								>
									<div className="flex items-center gap-3">
										<div className={`w-5 h-5 border-2 flex items-center justify-center ${enableCognee ? 'border-primary bg-primary' : 'border-ink'}`}>
											{enableCognee && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
										</div>
										<span className="font-bold text-sm tracking-widest uppercase">Cognee (Knowledge Graph)</span>
									</div>
								</button>
								{enableCognee && (
									<div className="p-4 border-t-2 border-primary bg-surface/30 space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Dataset ID</label>
												<input
													type="text"
													value={cogneeDataset}
													onChange={(e) => setCogneeDataset(e.target.value)}
													placeholder="default"
													className="w-full border-b border-ink bg-transparent py-2 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
												/>
											</div>
											<div>
												<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Graph Name</label>
												<input
													type="text"
													value={cogneeGraph}
													onChange={(e) => setCogneeGraph(e.target.value)}
													placeholder="default"
													className="w-full border-b border-ink bg-transparent py-2 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
												/>
											</div>
										</div>
										<div className="flex gap-4">
											<label className="flex items-center gap-2 cursor-pointer group">
												<input type="checkbox" checked={cogneeAutoCognify} onChange={(e) => setCogneeAutoCognify(e.target.checked)} className="sr-only" />
												<div className={`w-4 h-4 border-2 flex items-center justify-center ${cogneeAutoCognify ? 'border-primary bg-primary' : 'border-ink group-hover:border-primary/50'}`}>
													{cogneeAutoCognify && <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>}
												</div>
												<span className="text-[10px] font-bold tracking-widest uppercase text-muted">Auto Cognify</span>
											</label>
											<label className="flex items-center gap-2 cursor-pointer group">
												<input type="checkbox" checked={cogneeEntities} onChange={(e) => setCogneeEntities(e.target.checked)} className="sr-only" />
												<div className={`w-4 h-4 border-2 flex items-center justify-center ${cogneeEntities ? 'border-primary bg-primary' : 'border-ink group-hover:border-primary/50'}`}>
													{cogneeEntities && <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>}
												</div>
												<span className="text-[10px] font-bold tracking-widest uppercase text-muted">Entities</span>
											</label>
											<label className="flex items-center gap-2 cursor-pointer group">
												<input type="checkbox" checked={cogneeRelations} onChange={(e) => setCogneeRelations(e.target.checked)} className="sr-only" />
												<div className={`w-4 h-4 border-2 flex items-center justify-center ${cogneeRelations ? 'border-primary bg-primary' : 'border-ink group-hover:border-primary/50'}`}>
													{cogneeRelations && <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>}
												</div>
												<span className="text-[10px] font-bold tracking-widest uppercase text-muted">Relationships</span>
											</label>
										</div>
									</div>
								)}
							</div>

							{/* HippoRAG Card */}
							<div className={`border-2 transition-colors ${enableHipporag ? 'border-primary' : 'border-ink/20 hover:border-ink/50'}`}>
								<button
									type="button"
									onClick={() => setEnableHipporag(!enableHipporag)}
									className="w-full flex items-center justify-between p-4 bg-white cursor-pointer"
								>
									<div className="flex items-center gap-3">
										<div className={`w-5 h-5 border-2 flex items-center justify-center ${enableHipporag ? 'border-primary bg-primary' : 'border-ink'}`}>
											{enableHipporag && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
										</div>
										<span className="font-bold text-sm tracking-widest uppercase">HippoRAG (Multi-hop)</span>
									</div>
								</button>
								{enableHipporag && (
									<div className="p-4 border-t-2 border-primary bg-surface/30">
										<div>
											<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Dataset ID</label>
											<input
												type="text"
												value={hipporagDataset}
												onChange={(e) => setHipporagDataset(e.target.value)}
												placeholder="default"
												className="w-full border-b border-ink bg-transparent py-2 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<footer className="flex-none flex flex-col pt-0 transition-all bg-white relative z-20">
					{/* Advanced Accordion Toggle */}
					<button
						type="button"
						onClick={() => setAdvancedOpen(!advancedOpen)}
						className="flex items-center justify-between w-full p-4 border-t-4 border-ink font-bold text-xs tracking-widest uppercase hover:bg-surface transition-colors cursor-pointer group"
					>
						<span className="flex items-center gap-2">
							<span className="material-symbols-outlined text-sm">tune</span>
							Advanced Parameters
						</span>
						<span className="material-symbols-outlined text-sm transition-transform duration-300 transform group-hover:scale-110">
							{advancedOpen ? "remove" : "add"}
						</span>
					</button>

					{/* Advanced Accordion Content */}
					<div
						className={`overflow-hidden transition-all duration-300 ease-in-out border-b-4 border-ink bg-surface ${
							advancedOpen ? "max-h-[500px]" : "max-h-0 border-b-0"
						}`}
					>
						<div className="p-6 space-y-6">
							<div>
								<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
									Chunking Strategy Override
								</label>
								<div className="grid grid-cols-3 gap-0 border border-ink">
									{(
										[
											{ id: "", label: "Auto" },
											{ id: "fixed", label: "Fixed" },
											{ id: "recursive", label: "Recursive" },
											{ id: "semantic", label: "Semantic" },
										] as const
									).map((strat) => (
										<label
											key={strat.id}
											className={`flex-1 py-2 font-bold text-[10px] tracking-widest uppercase text-center transition-all cursor-pointer ${
												advStrategy === strat.id
													? "bg-black text-white"
													: "bg-white text-ink hover:bg-surface hover:text-primary border-r border-ink last:border-r-0"
											}`}
										>
											<input
												type="radio"
												name="advStrategy"
												value={strat.id}
												checked={advStrategy === strat.id}
												onChange={(e) =>
													setAdvStrategy(e.target.value as typeof advStrategy)
												}
												className="sr-only"
											/>
											{strat.label}
										</label>
									))}
								</div>
								<p className="text-[9px] mt-1.5 font-mono text-muted uppercase">
									Overrides Global Config. Inheriting:{" "}
									<span className="font-bold">{strategy}</span>
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
										Max Tokens Custom
									</label>
									<input
										type="number"
										min="100"
										max="8192"
										value={advChunkSize}
										onChange={(e) => setAdvChunkSize(e.target.value)}
										placeholder={`e.g. ${chunkSize}`}
										className="w-full border border-ink bg-white py-2 px-3 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
									/>
								</div>
								<div>
									<label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
										Overlap Custom
									</label>
									<input
										type="number"
										min="0"
										max="1024"
										value={advOverlap}
										onChange={(e) => setAdvOverlap(e.target.value)}
										placeholder={`e.g. ${overlap}`}
										className="w-full border border-ink bg-white py-2 px-3 font-mono text-xs placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="p-6 space-y-3 bg-white">
						{/* Error */}
						{activeMutation.isError && (
							<div className="flex items-start gap-2 border border-signal bg-signal/10 p-3">
								<span className="material-symbols-outlined text-signal text-sm mt-0.5">
									error
								</span>
								<p className="font-mono text-xs text-signal">
									{activeMutation.error?.message}
								</p>
							</div>
						)}

						{/* Success */}
						{successMsg && (
							<div className="flex items-center gap-2 border border-green-700 bg-green-50 p-3">
								<span className="material-symbols-outlined text-green-700 text-sm">
									check_circle
								</span>
								<p className="font-mono text-xs text-green-700">{successMsg}</p>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="button"
							onClick={handleSubmit}
							disabled={submitDisabled}
							style={
								!submitDisabled
									? { backgroundColor: "#FF4D00", color: "#FFFFFF" }
									: {}
							}
							className={`w-full py-4 border-2 border-ink shadow-[4px_4px_0px_#000] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all cursor-pointer ${
								submitDisabled
									? "bg-surface text-muted shadow-none translate-y-1 border-opacity-30 cursor-not-allowed"
									: "hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-none"
							}`}
						>
							{isSubmitting ? (
								<>
									<span className="material-symbols-outlined text-sm animate-spin">
										progress_activity
									</span>
									Processing
									<span className="animate-blink">_</span>
								</>
							) : (
								<>
									<span className="material-symbols-outlined text-sm">
										{tab === "upload"
											? "upload_file"
											: tab === "url"
												? "link"
												: "settings_ethernet"}
									</span>
									{tab === "upload"
										? `Upload ${files.length ? `(${files.length})` : ""}`
										: tab === "url"
											? "Ingest from URL"
											: "Commit Job"}
								</>
							)}
						</button>
					</div>
				</footer>
			</aside>
		</>
	);
}
