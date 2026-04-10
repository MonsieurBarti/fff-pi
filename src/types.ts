// Domain types shared across the extension.

export interface FindOptions {
	maxResults?: number;
}

export interface FindResultItem {
	path: string;
	relativePath: string;
	fileName: string;
	score: number;
	frecencyScore: number;
	gitStatus: string;
	matchType: string;
}

export interface FindResult {
	items: FindResultItem[];
	totalMatched: number;
	totalFiles: number;
}

export interface GrepOptions {
	maxResults?: number;
	regex?: boolean;
	caseSensitive?: boolean;
	context?: number;
}

export interface GrepResultItem {
	path: string;
	relativePath: string;
	fileName: string;
	lineNumber: number;
	lineContent: string;
	matchRanges: [number, number][];
	contextBefore?: string[];
	contextAfter?: string[];
	frecencyScore: number;
	gitStatus: string;
}

export interface GrepResult {
	items: GrepResultItem[];
	totalMatched: number;
	totalFilesSearched: number;
	totalFiles: number;
}

export interface SearchOptions {
	maxResults?: number;
}

export type SearchMode = "find" | "grep" | "both";

export interface SearchResult {
	mode: SearchMode;
	findResults?: FindResult;
	grepResults?: GrepResult;
}

export interface IndexStatus {
	initialized: boolean;
	indexedFiles: number;
	isScanning: boolean;
	basePath: string;
	frecencyEnabled: boolean;
	gitAvailable: boolean;
	gitRepositoryFound: boolean;
	version: string;
}

export interface FffConfig {
	search: {
		defaultMaxResults: number;
		defaultEditDistance: number;
		defaultContextLines: number;
	};
	frecency: {
		enabled: boolean;
	};
	git: {
		refreshIntervalSeconds: number;
	};
}

export const DEFAULT_CONFIG: FffConfig = {
	search: {
		defaultMaxResults: 20,
		defaultEditDistance: 2,
		defaultContextLines: 2,
	},
	frecency: {
		enabled: true,
	},
	git: {
		refreshIntervalSeconds: 30,
	},
};
