export default function IntegrationGuide() {
	return (
		<main className="flex-grow grid grid-cols-1 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_600px] bg-white h-full overflow-hidden">
			<div className="border-r border-black p-8 lg:p-16 overflow-y-auto">
				<div className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
					<span>Control Plane</span>
					<span className="material-symbols-outlined text-[12px]">
						chevron_right
					</span>
					<span className="text-black">Integration Guide v2.4.0</span>
				</div>

				<section className="mb-24">
					<div className="flex items-start gap-6 mb-8">
						<span className="text-6xl font-black leading-none tracking-tighter">
							01
						</span>
						<div>
							<h3 className="text-2xl font-black uppercase tracking-tight mb-4">
								API Authentication
							</h3>
							<p className="max-w-xl text-muted leading-relaxed mb-6">
								All requests to the Swiss System Control Plane must be
								authenticated via the{" "}
								<code className="font-mono bg-surface px-1 text-black text-sm">
									X-API-Key
								</code>{" "}
								header. Unauthorized requests will return a{" "}
								<code className="font-mono text-primary">
									401 Static Failure
								</code>
								.
							</p>
						</div>
					</div>

					<div className="border border-black bg-white overflow-hidden max-w-2xl">
						<div className="grid grid-cols-[180px_1fr] border-b border-black">
							<div className="p-4 border-r border-black bg-surface text-[11px] font-black uppercase tracking-widest text-muted">
								Header Key
							</div>
							<div className="p-4 font-mono text-sm font-bold">X-API-Key</div>
						</div>
						<div className="grid grid-cols-[180px_1fr]">
							<div className="p-4 border-r border-black bg-surface text-[11px] font-black uppercase tracking-widest text-muted">
								Value Format
							</div>
							<div className="p-4 font-mono text-sm font-medium italic text-muted">
								UUIDv4 (e.g., 550e8400-e29b-41d4-a716-446655440000)
							</div>
						</div>
					</div>
				</section>

				<section className="mb-24">
					<div className="flex items-start gap-6 mb-8">
						<span className="text-6xl font-black leading-none tracking-tighter text-primary">
							02
						</span>
						<div>
							<h3 className="text-2xl font-black uppercase tracking-tight mb-4">
								File Upload
							</h3>
							<p className="max-w-xl text-muted leading-relaxed mb-6">
								Upload files directly via multipart/form-data. The system
								creates ingestion jobs automatically and returns job IDs for
								tracking.
							</p>
						</div>
					</div>

					<div className="border border-black bg-white overflow-hidden mb-6">
						<div className="bg-black text-white px-4 py-2 font-mono text-xs flex items-center gap-2">
							<span className="bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-black">
								POST
							</span>
							<span>/api/v1/upload</span>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<h4 className="text-[11px] font-black uppercase tracking-widest text-muted mb-3">
									Request Body (multipart/form-data)
								</h4>
								<table className="w-full text-left text-sm">
									<thead className="border-b border-black">
										<tr>
											<th className="py-2 pr-4 font-bold">Field</th>
											<th className="py-2 pr-4 font-bold">Type</th>
											<th className="py-2 pr-4 font-bold">Required</th>
											<th className="py-2 font-bold">Description</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										<tr>
											<td className="py-2 pr-4 font-mono text-primary">
												files
											</td>
											<td className="py-2 pr-4">File[]</td>
											<td className="py-2 pr-4">Yes</td>
											<td>Files to upload (can be multiple)</td>
										</tr>
										<tr>
											<td className="py-2 pr-4 font-mono text-primary">
												priority
											</td>
											<td className="py-2 pr-4">string</td>
											<td className="py-2 pr-4">No</td>
											<td>low, normal (default), or high</td>
										</tr>
										<tr>
											<td className="py-2 pr-4 font-mono text-primary">
												pipeline_id
											</td>
											<td className="py-2 pr-4">string</td>
											<td className="py-2 pr-4">No</td>
											<td>Pipeline configuration UUID</td>
										</tr>
										<tr>
											<td className="py-2 pr-4 font-mono text-primary">
												metadata
											</td>
											<td className="py-2 pr-4">string (JSON)</td>
											<td className="py-2 pr-4">No</td>
											<td>Custom metadata as JSON string</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<div className="border border-black bg-white overflow-hidden">
						<div className="bg-surface px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold text-muted">
							cURL Example
						</div>
						<div className="p-4 bg-ink text-gray-300 font-mono text-xs overflow-x-auto">
							<pre>{`curl -X POST "http://localhost:8000/api/v1/upload" \\
  -H "X-API-Key: your-api-key" \\
  -F "files=@document.pdf" \\
  -F "files=@image.png" \\
  -F "priority=high" \\
  -F 'metadata={"department":"finance"}'`}</pre>
						</div>
					</div>
				</section>

				<section className="mb-24">
					<div className="flex items-start gap-6 mb-8">
						<span className="text-6xl font-black leading-none tracking-tighter text-primary">
							04
						</span>
						<div>
							<h3 className="text-2xl font-black uppercase tracking-tight mb-4">
								Endpoint Mapping
							</h3>
							<p className="max-w-xl text-muted leading-relaxed">
								Use the following mapping to connect your UI controllers to the
								appropriate Antigravity REST resources.
							</p>
						</div>
					</div>

					<div className="border border-black bg-white overflow-hidden">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
									<th className="p-4 border-r border-black border-b">
										UI Module / Component
									</th>
									<th className="p-4 border-r border-black border-b">Method</th>
									<th className="p-4 border-b border-black">
										Resource Endpoint
									</th>
								</tr>
							</thead>
							<tbody className="text-sm font-medium">
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										List Jobs
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-black">
											GET
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/jobs
									</td>
								</tr>
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										Create Job
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black">
											POST
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/jobs
									</td>
								</tr>
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										Upload Files
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black">
											POST
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/upload
									</td>
								</tr>
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										Ingest from URL
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black">
											POST
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/upload/url
									</td>
								</tr>
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										RAG Calibration
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black">
											POST
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/search/hybrid
									</td>
								</tr>
								<tr className="border-b border-black hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										Vector Inspector
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-black">
											GET
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/jobs/&#123;id&#125;/chunks
									</td>
								</tr>
								<tr className="hover:bg-surface transition-colors group">
									<td className="p-4 border-r border-black text-black font-bold uppercase tracking-tight">
										Pipeline Config
									</td>
									<td className="p-4 border-r border-black">
										<span className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black">
											POST
										</span>
									</td>
									<td className="p-4 font-mono text-muted group-hover:text-black">
										/api/v1/pipelines
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section>
					<div className="flex items-start gap-6 mb-8">
						<span className="text-6xl font-black leading-none tracking-tighter">
							05
						</span>
						<div>
							<h3 className="text-2xl font-black uppercase tracking-tight mb-4">
								Real-time Updates
							</h3>
							<p className="max-w-xl text-muted leading-relaxed mb-6">
								The{" "}
								<span className="text-primary font-bold uppercase italic">
									System Live
								</span>{" "}
								status indicator uses a hybrid polling mechanism. For
								high-frequency telemetry, establish a WebSocket connection to
								the stream endpoint.
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="border border-black p-6 flex flex-col gap-4">
							<span className="material-symbols-outlined text-primary">
								sensors
							</span>
							<h4 className="text-xs font-black uppercase tracking-widest">
								Polling Interval
							</h4>
							<p className="text-sm text-muted">
								Recommended 5000ms jitter-controlled polling for heartbeat
								verification.
							</p>
						</div>
						<div className="border border-black p-6 flex flex-col gap-4 bg-black text-white">
							<span className="material-symbols-outlined text-primary">
								sync_alt
							</span>
							<h4 className="text-xs font-black uppercase tracking-widest">
								WebSocket Stream
							</h4>
							<p className="text-sm text-gray-400 font-mono break-all">
								wss://api.antigravity.sys/v1/telemetry/live
							</p>
						</div>
					</div>
				</section>
			</div>

			<div className="bg-surface p-8 lg:p-12 relative overflow-y-auto">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<span className="text-6xl font-black leading-none tracking-tighter opacity-10">
							03
						</span>
						<h3 className="text-xl font-black uppercase tracking-tight">
							Code Snippet
						</h3>
					</div>
					<div className="flex items-center gap-2">
						<span className="size-2 bg-green-500"></span>
						<span className="text-[10px] font-black uppercase tracking-widest text-muted">
							Typescript / Fetch
						</span>
					</div>
				</div>

				<div className="border border-black bg-ink text-gray-300 p-6 font-mono text-[13px] leading-relaxed relative group shadow-2xl">
					<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<button
							type="button"
							className="bg-white/10 hover:bg-white/20 p-2 text-white"
						>
							<span className="material-symbols-outlined text-sm leading-none">
								content_copy
							</span>
						</button>
					</div>
					<pre className="overflow-x-auto">
						<span className="text-primary font-bold">async function</span>{" "}
						<span className="text-blue-400">performHybridSearch</span>(query:{" "}
						<span className="text-green-400">string</span>) &#123;
						<span className="text-gray-500">
							{/* Initialize Swiss System Request */}
						</span>
						<span className="text-primary font-bold">const</span> response ={" "}
						<span className="text-primary font-bold">await</span>{" "}
						<span className="text-blue-400">fetch</span>(
						<span className="text-orange-300">
							'https://api.antigravity.sys/v1/search/hybrid'
						</span>
						, &#123; method: <span className="text-orange-300">'POST'</span>,
						headers: &#123;
						<span className="text-orange-300">'Content-Type'</span>:{" "}
						<span className="text-orange-300">'application/json'</span>,
						<span className="text-orange-300">'X-API-Key'</span>:{" "}
						<span className="text-orange-300">
							'550e8400-e29b-41d4-a716-446655440000'
						</span>
						&#125;, body: <span className="text-blue-400">JSON</span>.
						<span className="text-blue-400">stringify</span>(&#123; query:
						query, alpha: <span className="text-orange-400">0.5</span>, limit:{" "}
						<span className="text-orange-400">10</span>, filters: &#123; status:{" "}
						<span className="text-orange-300">'active'</span>
						&#125; &#125;) &#125;);
						<span className="text-primary font-bold">if</span> (!response.ok)
						&#123;
						<span className="text-primary font-bold">throw new</span>{" "}
						<span className="text-blue-400">Error</span>(
						<span className="text-orange-300">'ANTIGRAVITY_SYNC_ERR'</span>);
						&#125;
						<span className="text-primary font-bold">return await</span>{" "}
						response.<span className="text-blue-400">json</span>(); &#125;
					</pre>
				</div>

				<div className="mt-12">
					<h4 className="text-[11px] font-black uppercase tracking-widest mb-6 text-muted border-b border-gray-200 pb-2">
						Technical Flow Diagram
					</h4>
					<div className="border border-black bg-white h-64 flex flex-col items-center justify-center p-8 relative overflow-hidden">
						<div
							className="absolute inset-0 opacity-[0.03]"
							style={{
								backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
								backgroundSize: "20px 20px",
							}}
						></div>

						<div className="flex items-center gap-8 z-10 w-full max-w-md mx-auto justify-center">
							<div className="w-24 h-24 border border-black bg-white flex flex-col items-center justify-center gap-2">
								<span className="material-symbols-outlined text-primary">
									desktop_windows
								</span>
								<span className="text-[9px] font-black uppercase text-center">
									UI Control
								</span>
							</div>

							<div className="flex flex-col items-center justify-center gap-1 flex-1 min-w-[60px]">
								<span className="text-[8px] font-black uppercase text-muted text-center leading-none">
									JSON Payload
								</span>
								<span className="material-symbols-outlined text-muted text-xl leading-none">
									arrow_right_alt
								</span>
							</div>

							<div className="w-32 h-24 border border-black bg-black text-white flex flex-col items-center justify-center gap-2 p-2">
								<span className="material-symbols-outlined text-primary">
									hub
								</span>
								<span className="text-[9px] text-center font-black uppercase tracking-tighter leading-tight">
									Antigravity Gateway
								</span>
							</div>
						</div>

						<div className="mt-8 flex gap-4 text-[9px] font-bold uppercase tracking-widest z-10">
							<div className="flex items-center gap-1.5">
								<span className="size-1.5 bg-primary block"></span> Auth
								Verified
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-1.5 bg-gray-300 block"></span> Request
								Stream
							</div>
						</div>
					</div>
				</div>

				<div className="mt-12 p-6 bg-primary text-white shadow-xl">
					<div className="flex gap-4 items-start">
						<span className="material-symbols-outlined text-2xl">warning</span>
						<div>
							<h4 className="text-xs font-black uppercase tracking-widest mb-2">
								Rate Limiting Alert
							</h4>
							<p className="text-xs leading-relaxed opacity-90">
								Production keys are restricted to 500 requests/sec. Contact
								Swiss System OPS for high-throughput clearance or to request a
								dedicated pipeline instance.
							</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
