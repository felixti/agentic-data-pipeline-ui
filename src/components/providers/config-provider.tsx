"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type ChunkingStrategy = "fixed" | "recursive" | "semantic";

interface ConfigContextProps {
	apiKey: string;
	setApiKey: (key: string) => void;
	strategy: ChunkingStrategy;
	setStrategy: (strategy: ChunkingStrategy) => void;
	chunkSize: number;
	setChunkSize: (size: number) => void;
	overlap: number;
	setOverlap: (overlap: number) => void;
}

const ConfigContext = createContext<ConfigContextProps | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [apiKey, setApiKeyValue] = useState<string>("");
	const [strategy, setStrategyValue] = useState<ChunkingStrategy>("recursive");
	const [chunkSize, setChunkSizeValue] = useState<number>(512);
	const [overlap, setOverlapValue] = useState<number>(64);

	useEffect(() => {
		const storedKey = localStorage.getItem("ag_api_key");
		if (storedKey) setApiKeyValue(storedKey);

		const storedStrategy = localStorage.getItem(
			"ag_strategy",
		) as ChunkingStrategy;
		if (storedStrategy) setStrategyValue(storedStrategy);

		const storedChunkSize = localStorage.getItem("ag_chunk_size");
		if (storedChunkSize) setChunkSizeValue(parseInt(storedChunkSize, 10));

		const storedOverlap = localStorage.getItem("ag_overlap");
		if (storedOverlap) setOverlapValue(parseInt(storedOverlap, 10));
	}, []);

	const setApiKey = (key: string) => {
		setApiKeyValue(key);
		localStorage.setItem("ag_api_key", key);
	};

	const setStrategy = (val: ChunkingStrategy) => {
		setStrategyValue(val);
		localStorage.setItem("ag_strategy", val);
	};

	const setChunkSize = (val: number) => {
		setChunkSizeValue(val);
		localStorage.setItem("ag_chunk_size", val.toString());
	};

	const setOverlap = (val: number) => {
		setOverlapValue(val);
		localStorage.setItem("ag_overlap", val.toString());
	};

	return (
		<ConfigContext.Provider
			value={{
				apiKey,
				setApiKey,
				strategy,
				setStrategy,
				chunkSize,
				setChunkSize,
				overlap,
				setOverlap,
			}}
		>
			{children}
		</ConfigContext.Provider>
	);
};

export const useConfig = () => {
	const context = useContext(ConfigContext);
	if (context === undefined) {
		throw new Error("useConfig must be used within a ConfigProvider");
	}
	return context;
};
