"use client";

export type ClassificationType = "factual" | "analytical" | "vague" | "unknown";

interface ClassificationBadgeProps {
	type?: ClassificationType;
	confidence?: number; // 0.0 to 1.0
}

export default function ClassificationBadge({
	type,
	confidence,
}: ClassificationBadgeProps) {
	if (!type || type === "unknown") return null;

	const getColors = (t: ClassificationType) => {
		switch (t) {
			case "factual":
				return "bg-blue-100 text-blue-800 border-blue-800";
			case "analytical":
				return "bg-amber-100 text-amber-800 border-amber-800";
			case "vague":
				return "bg-slate-100 text-slate-600 border-slate-600 dashed-border";
			default:
				return "bg-white text-ink border-ink";
		}
	};

	return (
		<div
			className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border ${getColors(type)} shadow-[1px_1px_0px_#000]`}
		>
			<span className="text-[9px] font-black uppercase tracking-widest leading-none">
				{type}
			</span>
			{confidence !== undefined && (
				<span className="text-[8px] font-mono opacity-80 border-l border-current pl-1 leading-none">
					{Math.round(confidence * 100)}%
				</span>
			)}
		</div>
	);
}
