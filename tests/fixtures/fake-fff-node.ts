import type {
	FileItem,
	GrepMatch,
	GrepResult,
	HealthCheck,
	Result,
	ScanProgress,
	SearchResult,
} from "@ff-labs/fff-node";
import { vi } from "vitest";

export interface FakeFileFinder {
	readonly fileSearch: ReturnType<typeof vi.fn>;
	readonly grep: ReturnType<typeof vi.fn>;
	readonly multiGrep: ReturnType<typeof vi.fn>;
	readonly scanFiles: ReturnType<typeof vi.fn>;
	readonly waitForScan: ReturnType<typeof vi.fn>;
	readonly reindex: ReturnType<typeof vi.fn>;
	readonly refreshGitStatus: ReturnType<typeof vi.fn>;
	readonly trackQuery: ReturnType<typeof vi.fn>;
	readonly healthCheck: ReturnType<typeof vi.fn>;
	readonly getScanProgress: ReturnType<typeof vi.fn>;
	readonly isScanning: ReturnType<typeof vi.fn>;
	readonly destroy: ReturnType<typeof vi.fn>;
	isDestroyed: boolean;
}

export function createFakeFileItem(overrides: Partial<FileItem> = {}): FileItem {
	return {
		path: "/project/src/index.ts",
		relativePath: "src/index.ts",
		fileName: "index.ts",
		size: 1024,
		modified: Math.floor(Date.now() / 1000),
		accessFrecencyScore: 0,
		modificationFrecencyScore: 0,
		totalFrecencyScore: 0,
		gitStatus: "clean",
		...overrides,
	};
}

export function createFakeGrepMatch(overrides: Partial<GrepMatch> = {}): GrepMatch {
	return {
		path: "/project/src/index.ts",
		relativePath: "src/index.ts",
		fileName: "index.ts",
		gitStatus: "clean",
		size: 1024,
		modified: Math.floor(Date.now() / 1000),
		isBinary: false,
		totalFrecencyScore: 0,
		accessFrecencyScore: 0,
		modificationFrecencyScore: 0,
		lineNumber: 10,
		col: 0,
		byteOffset: 200,
		lineContent: 'const result = "hello";',
		matchRanges: [[16, 21]],
		...overrides,
	};
}

export function createFakeSearchResult(items: FileItem[] = []): Result<SearchResult> {
	return {
		ok: true,
		value: {
			items,
			scores: items.map((_, i) => ({
				total: 100 - i * 10,
				baseScore: 80 - i * 10,
				filenameBonus: 10,
				specialFilenameBonus: 0,
				frecencyBoost: 10,
				distancePenalty: 0,
				currentFilePenalty: 0,
				comboMatchBoost: 0,
				exactMatch: i === 0,
				matchType: i === 0 ? "exact" : "fuzzy",
			})),
			totalMatched: items.length,
			totalFiles: 100,
		},
	};
}

export function createFakeGrepResult(items: GrepMatch[] = []): Result<GrepResult> {
	return {
		ok: true,
		value: {
			items,
			totalMatched: items.length,
			totalFilesSearched: 10,
			totalFiles: 100,
			filteredFileCount: 50,
			nextCursor: null,
		},
	};
}

export function createFakeFileFinder(): FakeFileFinder {
	return {
		fileSearch: vi.fn().mockReturnValue(createFakeSearchResult([createFakeFileItem()])),
		grep: vi.fn().mockReturnValue(createFakeGrepResult([createFakeGrepMatch()])),
		multiGrep: vi.fn().mockReturnValue(createFakeGrepResult([createFakeGrepMatch()])),
		scanFiles: vi.fn().mockReturnValue({ ok: true, value: undefined }),
		waitForScan: vi.fn().mockResolvedValue({ ok: true, value: true }),
		reindex: vi.fn().mockReturnValue({ ok: true, value: undefined }),
		refreshGitStatus: vi.fn().mockReturnValue({ ok: true, value: 0 }),
		trackQuery: vi.fn().mockReturnValue({ ok: true, value: true }),
		healthCheck: vi.fn().mockReturnValue({
			ok: true,
			value: {
				version: "0.5.1",
				git: { available: true, repositoryFound: true, libgit2Version: "1.8.0" },
				filePicker: { initialized: true, basePath: "/project", indexedFiles: 100 },
				frecency: { initialized: true },
				queryTracker: { initialized: true },
			} satisfies HealthCheck,
		}),
		getScanProgress: vi.fn().mockReturnValue({
			ok: true,
			value: { scannedFilesCount: 100, isScanning: false } satisfies ScanProgress,
		}),
		isScanning: vi.fn().mockReturnValue(false),
		destroy: vi.fn(),
		isDestroyed: false,
	};
}
