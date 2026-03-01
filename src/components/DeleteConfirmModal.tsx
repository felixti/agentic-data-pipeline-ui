"use client";

import { useCallback, useEffect } from "react";

interface DeleteConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel: string;
	isPending?: boolean;
	variant?: "danger" | "warning";
	error?: string | null;
}

export default function DeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel,
	isPending = false,
	variant = "danger",
	error,
}: DeleteConfirmModalProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape" && !isPending) onClose();
		},
		[onClose, isPending],
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

	const accentColor = variant === "danger" ? "#FF4D00" : "#f59e0b";
	const accentLabel = variant === "danger" ? "DANGER" : "WARNING";

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-modal-title"
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={() => !isPending && onClose()}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					if (!isPending) onClose();
				}
			}}
			tabIndex={-1}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-ink/60" />

			<div
				className="relative z-10 w-full max-w-md bg-white border-4 border-ink shadow-[8px_8px_0px_#000] mx-4"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="document"
			>
				{/* Header stripe */}
				<div
					className="flex items-center gap-3 px-5 py-3 border-b-4 border-ink"
					style={{ backgroundColor: accentColor }}
				>
					<span className="material-symbols-outlined text-white text-xl">
						{variant === "danger" ? "warning" : "info"}
					</span>
					<span className="font-bold text-xs tracking-widest uppercase text-white">
						{accentLabel}
					</span>
				</div>

				<div className="p-6">
					<h2
						id="delete-modal-title"
						className="font-bold text-xl uppercase tracking-tight text-ink mb-2"
					>
						{title}
					</h2>
					<p className="font-mono text-sm text-ink/70 leading-relaxed">
						{description}
					</p>

					{variant === "danger" && (
						<div className="mt-4 border-2 border-ink bg-surface px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink">
							⚠ THIS ACTION CANNOT BE UNDONE
						</div>
					)}

					{/* Error banner — shown when API call fails */}
					{error && (
						<div className="mt-3 border-2 border-red-600 bg-red-50 px-4 py-2 font-mono text-xs text-red-700 leading-relaxed">
							<span className="font-bold uppercase tracking-widest block mb-1">
								Server Error
							</span>
							{error}
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex border-t-4 border-ink">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="flex-1 py-4 font-bold text-xs tracking-widest uppercase bg-white hover:bg-surface transition-colors border-r-4 border-ink disabled:opacity-40 cursor-pointer"
					>
						{error ? "CLOSE" : "CANCEL"}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="flex-1 py-4 font-bold text-xs tracking-widest uppercase text-white hover:opacity-90 transition-colors disabled:opacity-40 cursor-pointer"
						style={{ backgroundColor: accentColor }}
					>
						{isPending ? "WORKING…" : error ? "RETRY" : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
