"use client";

import { useHealth } from "@/lib/api/hooks";

export default function Topology() {
	const { data: healthData, isLoading } = useHealth();

	const components = healthData?.components ?? {};
	const componentEntries = Object.entries(components);
	const healthyCount = componentEntries.filter(
		([, c]) => c.status === "healthy",
	).length;

	return (
		<main className="flex-1 p-8 grid grid-cols-12 gap-0 border-x border-black mx-8 mb-8 overflow-y-auto">
			<div className="col-span-12 border-b border-black pb-8 mb-8">
				<div className="flex flex-col xl:flex-row justify-between items-end gap-4">
					<div>
						<h1 className="text-[48px] font-bold uppercase tracking-[-0.02em] leading-none text-black">
							05 Topology
						</h1>
						<p className="mt-4 text-xl font-medium text-muted uppercase">
							System Architecture and Pipeline Health View
						</p>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
						<div className="border border-black p-4">
							<p className="text-[10px] font-bold uppercase text-muted mb-1">
								Status
							</p>
							<p className="font-mono text-2xl font-normal text-black">
								{isLoading ? "—" : (healthData?.status ?? "—")}
							</p>
						</div>
						<div className="border border-black p-4">
							<p className="text-[10px] font-bold uppercase text-muted mb-1">
								Components
							</p>
							<p className="font-mono text-2xl font-normal text-black">
								{isLoading ? "—" : componentEntries.length}
							</p>
						</div>
						<div className="border border-black p-4">
							<p className="text-[10px] font-bold uppercase text-muted mb-1">
								Healthy
							</p>
							<p className="font-mono text-2xl font-normal text-black">
								{isLoading ? "—" : `${healthyCount}/${componentEntries.length}`}
							</p>
						</div>
						<div className="border border-black p-4">
							<p className="text-[10px] font-bold uppercase text-muted mb-1">
								Version
							</p>
							<p className="font-mono text-2xl font-normal text-black">
								{isLoading ? "—" : (healthData?.version ?? "—")}
							</p>
						</div>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="col-span-12 flex items-center justify-center py-24">
					<span className="font-mono text-muted animate-pulse uppercase">
						Loading topology...
					</span>
				</div>
			) : (
				<>
					{componentEntries.map(([name, comp], idx) => (
						<div
							key={name}
							className="col-span-12 lg:col-span-4 xl:col-span-3 border-4 border-black p-6 flex flex-col gap-4 group hover:bg-black hover:text-white transition-colors bg-white"
						>
							<div className="flex justify-between items-start">
								<span className="text-3xl font-black">
									{String(idx + 1).padStart(2, "0")}
								</span>
								<span
									className={`material-symbols-outlined text-2xl ${comp.status === "healthy" ? "text-green-600" : comp.status === "degraded" ? "text-yellow-500" : "text-red-600"}`}
								>
									{comp.status === "healthy"
										? "check_circle"
										: comp.status === "degraded"
											? "warning"
											: "error"}
								</span>
							</div>
							<div>
								<h3 className="text-xl font-black uppercase mb-1 leading-none">
									{name.replace(/_/g, " ")}
								</h3>
								<p
									className={`text-[10px] font-bold uppercase ${comp.status === "healthy" ? "text-green-600" : comp.status === "degraded" ? "text-yellow-600" : "text-red-600"}`}
								>
									{comp.status}
								</p>
							</div>
							<div className="mt-auto space-y-2 pt-4 border-t border-current">
								{comp.latency_ms != null && (
									<div className="flex justify-between items-center text-[10px] font-mono">
										<span>LATENCY</span>
										<span className="font-bold text-primary">
											{comp.latency_ms.toFixed(0)}ms
										</span>
									</div>
								)}
								{comp.message && (
									<p
										className="text-[10px] font-mono opacity-60 truncate"
										title={comp.message}
									>
										{comp.message}
									</p>
								)}
							</div>
						</div>
					))}
				</>
			)}

			{!isLoading && componentEntries.length === 0 && (
				<div className="col-span-12 text-center py-24 text-muted font-mono uppercase">
					No component data available. Check API key.
				</div>
			)}
		</main>
	);
}
