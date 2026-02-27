"use client";

import { useConfig } from "@/components/providers/config-provider";
import { useState, useEffect } from "react";

export default function PipelineConfig() {
	const {
		apiKey,
		setApiKey,
		strategy,
		setStrategy,
		chunkSize,
		setChunkSize,
		overlap,
		setOverlap,
	} = useConfig();

	const [saveTime, setSaveTime] = useState<string>("Loading...");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setSaveTime(
			localStorage.getItem("ag_last_config_save") || "2023-10-24 14:02:11 UTC",
		);
	}, []);

	const handleCommit = () => {
		setIsSaving(true);
		setTimeout(() => {
			const now =
				new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
			localStorage.setItem("ag_last_config_save", now);
			setSaveTime(now);
			setIsSaving(false);
		}, 600);
	};

	const visualTotal = Math.max(chunkSize * 2.5, 1);
	const chunkWidthPct = (chunkSize / visualTotal) * 100;
	const overlapRelPct = overlap > 0 ? Math.min((overlap / chunkSize) * 100, 100) : 0;
	const advancePct = ((chunkSize - overlap) / visualTotal) * 100;


	return (
		<main className="grow flex flex-col md:flex-row h-full w-full max-w-[1920px] mx-auto border-x border-black border-t-0 bg-white">
			<aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-black flex flex-col relative h-full overflow-y-auto">
				<div className="p-8">
					<h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-6 uppercase">
						PIPELINE
						<br />
						CONFIG
					</h1>
					<p className="text-lg font-medium leading-relaxed mb-12 max-w-md">
						Configure ingestion strategies and chunking logic. Precision in
						these settings directly correlates to retrieval latency and semantic
						accuracy.
					</p>
					<div className="space-y-12">
						<div className="group">
							<span className="text-primary font-mono text-xs mb-2 block tracking-widest uppercase">
								SECTION
							</span>
							<h3 className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 flex items-baseline gap-4 text-black">
								01{" "}
								<span className="text-sm font-bold text-black uppercase tracking-widest">
									Strategy
								</span>
							</h3>
							<p className="text-xs font-medium text-black/70 border-l border-black pl-4 uppercase">
								Select the segmentation logic for document ingestion.
							</p>
						</div>

						<div className="group">
							<span className="text-primary font-mono text-xs mb-2 block tracking-widest uppercase">
								SECTION
							</span>
							<h3 className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 flex items-baseline gap-4 text-black">
								02{" "}
								<span className="text-sm font-bold text-black uppercase tracking-widest">
									Parameters
								</span>
							</h3>
							<p className="text-xs font-medium text-black/70 border-l border-black pl-4 uppercase">
								Define token limits and sliding window overlap.
							</p>
						</div>

						<div className="group">
							<span className="text-primary font-mono text-xs mb-2 block tracking-widest uppercase">
								SECTION
							</span>
							<h3 className="text-5xl lg:text-6xl font-black tracking-tighter mb-2 flex items-baseline gap-4 text-black">
								03{" "}
								<span className="text-sm font-bold text-black uppercase tracking-widest">
									Review
								</span>
							</h3>
							<p className="text-xs font-medium text-black/70 border-l border-black pl-4 uppercase">
								Visualize the topology before committing.
							</p>
						</div>
					</div>
				</div>

				<div className="mt-auto p-8 border-t border-black bg-surface">
					<div className="font-mono text-xs uppercase text-black/50 mb-2">
						Last Modified
					</div>
					<div className="font-mono text-sm font-bold">
						{saveTime}
					</div>
					<div className="font-mono text-sm font-bold">USER_ID: ADM-092</div>
				</div>
			</aside>

			<section className="w-full md:w-2/3 flex flex-col h-full overflow-y-auto">
				<div className="border-b border-black p-8 md:p-12">
					<div className="flex items-center gap-4 mb-8">
						<span className="bg-black text-white px-2 py-1 font-mono text-xs">
							01
						</span>
						<h4 className="text-2xl font-bold uppercase tracking-tight">
							Chunking Strategy
						</h4>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<label className="cursor-pointer group relative">
							<input
								className="peer sr-only"
								name="strategy"
								type="radio"
								value="fixed"
								checked={strategy === "fixed"}
								onChange={() => setStrategy("fixed")}
							/>
							<div className="h-full border border-black p-6 hover:bg-surface hover:text-black peer-checked:hover:bg-black peer-checked:hover:text-white transition-colors peer-checked:bg-black peer-checked:text-white relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]">
								<div className="size-4 border border-black mb-4 flex items-center justify-center peer-checked:border-white peer-checked:hover:border-white transition-colors">
									<div className="size-2 bg-white hidden peer-checked:block"></div>
								</div>
								<h5 className="font-black text-xl mb-2 uppercase tracking-tighter">
									Fixed Size
								</h5>
								<p className="text-xs font-medium uppercase leading-tight opacity-70">
									Hard cut at token limit. Simplest, fastest.
								</p>
							</div>
						</label>

						<label className="cursor-pointer group relative">
							<input
								className="peer sr-only"
								name="strategy"
								type="radio"
								value="recursive"
								checked={strategy === "recursive"}
								onChange={() => setStrategy("recursive")}
							/>
							<div className="h-full border border-black p-6 hover:bg-surface hover:text-black peer-checked:hover:bg-black peer-checked:hover:text-white transition-colors peer-checked:bg-black peer-checked:text-white relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]">
								<div className="size-4 border border-black mb-4 flex items-center justify-center peer-checked:border-white peer-checked:hover:border-white transition-colors">
									<div className="size-2 bg-white hidden peer-checked:block"></div>
								</div>
								<h5 className="font-black text-xl mb-2 uppercase tracking-tighter group-active:scale-95 transition-transform">
									Recursive
								</h5>
								<p className="text-xs font-medium uppercase leading-tight opacity-70">
									Respects paragraph boundaries. Best balance.
								</p>
							</div>
						</label>

						<label className="cursor-pointer group relative">
							<input
								className="peer sr-only"
								name="strategy"
								type="radio"
								value="semantic"
								checked={strategy === "semantic"}
								onChange={() => setStrategy("semantic")}
							/>
							<div className="h-full border border-black p-6 hover:bg-surface hover:text-black peer-checked:hover:bg-black peer-checked:hover:text-white transition-colors peer-checked:bg-black peer-checked:text-white relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]">
								<div className="size-4 border border-black mb-4 flex items-center justify-center peer-checked:border-white peer-checked:hover:border-white transition-colors">
									<div className="size-2 bg-white hidden peer-checked:block"></div>
								</div>
								<h5 className="font-black text-xl mb-2 uppercase tracking-tighter">
									Semantic
								</h5>
								<p className="text-xs font-medium uppercase leading-tight opacity-70">
									Embedding similarity. Highest latency.
								</p>
							</div>
						</label>
					</div>
				</div>

				<div className="border-b border-black p-8 md:p-12">
					<div className="flex items-center gap-4 mb-8">
						<span className="bg-black text-white px-2 py-1 font-mono text-xs">
							02
						</span>
						<h4 className="text-2xl font-bold uppercase tracking-tight">
							Security & Authentication
						</h4>
					</div>
					<div className="flex flex-col gap-0 group">
						<label
							className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
							htmlFor="api-key"
						>
							Production API Key
						</label>
						<div className="relative group/input">
							<input
								className="w-full bg-transparent border border-black text-lg md:text-2xl font-mono font-medium p-4 focus:ring-0 focus:border-primary placeholder-black/20 outline-none transition-colors hover:bg-surface"
								id="api-key"
								type="password"
								placeholder="Enter X-API-Key..."
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold transition-colors group-focus-within/input:text-primary">
								LOCAL_STORAGE
							</span>
						</div>
						<p className="text-[10px] font-mono mt-2 uppercase text-black font-bold">
							Used to authenticate all requests to the backend Service.
						</p>
					</div>
				</div>

				<div className="border-b border-black p-8 md:p-12">
					<div className="flex items-center gap-4 mb-8">
						<span className="bg-black text-white px-2 py-1 font-mono text-xs">
							03
						</span>
						<h4 className="text-2xl font-bold uppercase tracking-tight">
							Window Parameters
						</h4>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
						<div className="flex flex-col gap-0 group">
							<label
								className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
								htmlFor="chunk-size"
							>
								Max Chunk Size (Tokens)
							</label>
							<div className="relative group/input">
								<input
									className="w-full bg-transparent border border-black text-4xl font-mono font-medium p-4 focus:ring-0 focus:border-primary placeholder-black/20 outline-none transition-colors hover:bg-surface"
									id="chunk-size"
									type="number"
									value={chunkSize}
									onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 0)}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold transition-colors group-focus-within/input:text-primary">
									MAX_LIMIT: 8192
								</span>
							</div>
							<p className="text-[10px] font-mono mt-2 uppercase text-black font-bold">
								RECMND_VAL: 512
							</p>
						</div>

						<div className="flex flex-col gap-0 group">
							<label
								className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
								htmlFor="overlap"
							>
								Overlap Window
							</label>
							<div className="relative group/input">
								<input
									className="w-full bg-transparent border border-black text-4xl font-mono font-medium p-4 focus:ring-0 focus:border-primary placeholder-black/20 outline-none transition-colors hover:bg-surface"
									id="overlap"
									type="number"
									value={overlap}
									onChange={(e) => setOverlap(parseInt(e.target.value, 10) || 0)}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold transition-colors group-focus-within/input:text-primary">
									RATIO: {chunkSize > 0 ? ((overlap / chunkSize) * 100).toFixed(1) : 0}%
								</span>
							</div>
							<p className="text-[10px] font-mono mt-2 uppercase text-black font-bold">
								CONTEXT_RETAIN: ON
							</p>
						</div>
					</div>
				</div>

				<div className="grow p-8 md:p-12 flex flex-col relative w-full">
					<div className="flex items-center justify-between mb-12">
						<div className="flex items-center gap-4">
							<span className="bg-black text-white px-2 py-1 font-mono text-xs">
								04
							</span>
							<h4 className="text-2xl font-black uppercase tracking-tighter">
								Topology Preview
							</h4>
						</div>
						<div className="flex items-center gap-8 text-[10px] font-mono font-bold">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 border border-black bg-white"></div>
								<span>CONTENT_BLOCK</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-primary"></div>
								<span>OVERLAP_SIGNAL</span>
							</div>
						</div>
					</div>

					<section
						aria-label="Visualization of text chunking with overlap"
						className="w-full grow flex flex-col justify-center gap-8 font-mono text-xs text-black overflow-hidden relative"
					>
						<div
							className="relative h-12 border border-black bg-white flex items-center shadow-none z-10"
							style={{ width: `${chunkWidthPct}%` }}
						>
							<div className="h-full px-4 flex items-center border-r border-black font-bold uppercase tracking-tighter bg-black text-white truncation overflow-hidden whitespace-nowrap">
								CHUNK_001
							</div>
							<div className="grow"></div>
							{overlap > 0 && (
								<div
									className="h-full bg-primary flex items-center justify-center border-l border-black overflow-hidden"
									style={{ width: `${overlapRelPct}%` }}
								>
									<span className="text-[10px] font-bold text-white truncate px-1">
										{overlap}
									</span>
								</div>
							)}
						</div>

						<div
							className="relative h-12 border border-black bg-white flex items-center shadow-none z-10"
							style={{
								width: `${chunkWidthPct}%`,
								marginLeft: `${advancePct}%`,
							}}
						>
							{overlap > 0 && (
								<div
									className="h-full bg-primary flex items-center justify-center border-r border-black overflow-hidden"
									style={{ width: `${overlapRelPct}%` }}
								>
									<span className="text-[10px] font-bold text-white truncate px-1">
										{overlap}
									</span>
								</div>
							)}
							<div className="h-full px-4 flex items-center border-r border-black font-bold uppercase tracking-tighter bg-black text-white truncation overflow-hidden whitespace-nowrap">
								CHUNK_002
							</div>
							<div className="grow"></div>
							{overlap > 0 && (
								<div
									className="h-full bg-primary flex items-center justify-center border-l border-black overflow-hidden"
									style={{ width: `${overlapRelPct}%` }}
								>
									<span className="text-[10px] font-bold text-white truncate px-1">
										{overlap}
									</span>
								</div>
							)}
						</div>

						<div
							className="relative h-12 border border-black bg-white flex items-center shadow-none z-10"
							style={{
								width: `${chunkWidthPct}%`,
								marginLeft: `${advancePct * 2}%`,
							}}
						>
							{overlap > 0 && (
								<div
									className="h-full bg-primary flex items-center justify-center border-r border-black overflow-hidden"
									style={{ width: `${overlapRelPct}%` }}
								>
									<span className="text-[10px] font-bold text-white truncate px-1">
										{overlap}
									</span>
								</div>
							)}
							<div className="h-full px-4 flex items-center border-r border-black font-bold uppercase tracking-tighter bg-black text-white truncation overflow-hidden whitespace-nowrap">
								CHUNK_003
							</div>
							<div className="grow"></div>
							<div className="absolute -right-16 top-1/2 -translate-y-1/2 items-center gap-2 hidden md:flex">
								<div className="h-px w-8 bg-black"></div>
								<span className="text-[10px] font-bold">EOF_0x11</span>
							</div>
						</div>

						<div className="mt-4 flex justify-between w-full text-[10px] font-bold uppercase border-t border-black pt-2 opacity-50">
							<span>0_TOK</span>
							<span>{Math.round(visualTotal * 0.25)}_TOK</span>
							<span>{Math.round(visualTotal * 0.5)}_TOK</span>
							<span>{Math.round(visualTotal * 0.75)}_TOK</span>
							<span>{Math.round(visualTotal)}_TOK</span>
						</div>
					</section>

					<div className="mt-auto pt-12">
						<button
							type="button"
							onClick={handleCommit}
							disabled={isSaving}
							className={`bg-black text-white transition-all duration-300 h-20 px-12 text-xl font-black tracking-[0.2em] uppercase flex items-center gap-6 group w-full justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
								isSaving
									? "cursor-wait bg-ink opacity-80"
									: "cursor-pointer hover:bg-primary hover:shadow-[0_8px_0px_rgba(255,68,0,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
							}`}
						>
							<span>{isSaving ? "SAVING..." : "COMMIT CONFIG"}</span>
							{isSaving ? (
								<span className="material-symbols-outlined text-3xl animate-spin">
									progress_activity
								</span>
							) : (
								<span className="material-symbols-outlined text-3xl group-hover:translate-x-4 transition-transform duration-300">
									arrow_right_alt
								</span>
							)}
						</button>
					</div>
				</div>
			</section>
		</main>
	);
}
