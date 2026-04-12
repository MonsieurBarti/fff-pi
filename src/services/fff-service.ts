import { join } from "node:path";

import type { GrepResult as FffGrepResult } from "@ff-labs/fff-node";
import { FileFinder } from "@ff-labs/fff-node";

import type {
	FffConfig,
	FindOptions,
	FindResult,
	GrepOptions,
	GrepResult,
	IndexStatus,
	SearchOptions,
	SearchResult,
} from "../types";
import { DEFAULT_CONFIG } from "../types";
import { getFffDir, loadConfig } from "./config";

const FILE_EXTENSION_PATTERN = /\.\w{1,10}$/;
const GLOB_CHARS = /[*?]/;
const REGEX_META_CHARS = /[[\]()|\\^${}]/;

export function detectSearchMode(query: string): "find" | "grep" | "both" {
	// File path signal: contains /, has a file extension, or glob chars
	if (query.includes("/")) return "find";
	if (FILE_EXTENSION_PATTERN.test(query)) return "find";
	if (GLOB_CHARS.test(query)) return "find";

	// Content signal: regex metacharacters, whitespace, or pipe
	if (REGEX_META_CHARS.test(query)) return "grep";
	if (/\s/.test(query)) return "grep";

	// Ambiguous single word — run both
	return "both";
}

export class FffService {
	private finder: FileFinder | null = null;
	private config: FffConfig = structuredClone(DEFAULT_CONFIG);
	private cwd = "";
	private lastGitRefresh = 0;

	async initialize(cwd: string, opts: { signal?: AbortSignal } = {}): Promise<void> {
		if (opts.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		this.cwd = cwd;
		this.config = loadConfig(cwd);

		const fffDir = getFffDir(cwd);
		const initOptions = {
			basePath: cwd,
			historyDbPath: join(fffDir, "history.db"),
			aiMode: true as const,
			...(this.config.frecency.enabled ? { frecencyDbPath: join(fffDir, "frecency.db") } : {}),
		};
		const result = FileFinder.create(initOptions);

		if (!result.ok) {
			throw new Error(result.error);
		}

		this.finder = result.value;

		const signal = opts.signal;
		if (!signal) {
			await this.finder.waitForScan(10_000);
			return;
		}

		const finder = this.finder;
		let onAbort: (() => void) | undefined;
		try {
			await new Promise<void>((resolve, reject) => {
				onAbort = () => {
					reject(new DOMException("Aborted", "AbortError"));
				};
				signal.addEventListener("abort", onAbort, { once: true });
				finder.waitForScan(10_000).then(
					() => resolve(),
					(err) => reject(err as Error),
				);
			});
		} catch (err) {
			if (this.finder && !this.finder.isDestroyed) {
				this.finder.destroy();
			}
			this.finder = null;
			throw err;
		} finally {
			if (onAbort) signal.removeEventListener("abort", onAbort);
		}
	}

	async shutdown(): Promise<void> {
		if (this.finder && !this.finder.isDestroyed) {
			this.finder.destroy();
		}
		this.finder = null;
	}

	async reindex(): Promise<void> {
		this.ensureInitialized();
		const finder = this.finder as FileFinder;
		const result = finder.scanFiles();
		if (!result.ok) {
			throw new Error(result.error);
		}
		await finder.waitForScan(10_000);
	}

	getStatus(): IndexStatus {
		if (!this.finder) {
			return {
				initialized: false,
				indexedFiles: 0,
				isScanning: false,
				basePath: this.cwd,
				frecencyEnabled: false,
				gitAvailable: false,
				gitRepositoryFound: false,
				version: "unknown",
			};
		}

		const health = this.finder.healthCheck();
		if (!health.ok) {
			return {
				initialized: true,
				indexedFiles: 0,
				isScanning: false,
				basePath: this.cwd,
				frecencyEnabled: this.config.frecency.enabled,
				gitAvailable: false,
				gitRepositoryFound: false,
				version: "unknown",
			};
		}

		const h = health.value;
		return {
			initialized: true,
			indexedFiles: h.filePicker.indexedFiles ?? 0,
			isScanning: h.filePicker.isScanning ?? false,
			basePath: h.filePicker.basePath ?? this.cwd,
			frecencyEnabled: h.frecency.initialized,
			gitAvailable: h.git.available,
			gitRepositoryFound: h.git.repositoryFound,
			version: h.version,
		};
	}

	refreshGitIfStale(): void {
		if (!this.finder) return;
		const now = Date.now();
		if (now - this.lastGitRefresh > this.config.git.refreshIntervalSeconds * 1000) {
			this.finder.refreshGitStatus();
			this.lastGitRefresh = now;
		}
	}

	find(query: string, opts: FindOptions = {}): FindResult {
		this.ensureInitialized();

		const maxResults = opts.maxResults ?? this.config.search.defaultMaxResults;
		const finder = this.finder as FileFinder;
		const result = finder.fileSearch(query, {
			pageSize: maxResults,
		});

		if (!result.ok) {
			throw new Error(result.error);
		}

		const { items, scores, totalMatched, totalFiles } = result.value;

		return {
			items: items.map((item, i) => ({
				path: item.path,
				relativePath: item.relativePath,
				fileName: item.fileName,
				score: scores[i]?.total ?? 0,
				frecencyScore: item.totalFrecencyScore,
				gitStatus: item.gitStatus,
				matchType: scores[i]?.matchType ?? "fuzzy",
			})),
			totalMatched,
			totalFiles,
		};
	}

	grep(patterns: string[], opts: GrepOptions = {}): GrepResult {
		this.ensureInitialized();
		const finder = this.finder as FileFinder;

		const contextLines = opts.context ?? this.config.search.defaultContextLines;
		const smartCase = opts.caseSensitive === undefined ? true : !opts.caseSensitive;
		const maxResults = opts.maxResults;

		const sharedOpts = {
			smartCase,
			beforeContext: contextLines,
			afterContext: contextLines,
		};

		let raw: import("@ff-labs/fff-node").Result<FffGrepResult>;

		if (patterns.length === 1) {
			// biome-ignore lint/style/noNonNullAssertion: length === 1 guarantees index 0 exists
			raw = finder.grep(patterns[0]!, {
				mode: opts.regex ? "regex" : "plain",
				...sharedOpts,
			});
		} else {
			raw = finder.multiGrep({
				patterns,
				...sharedOpts,
			});
		}

		if (!raw.ok) {
			throw new Error(raw.error);
		}

		const { items: rawItems, totalMatched, totalFilesSearched, totalFiles } = raw.value;
		const items = maxResults !== undefined ? rawItems.slice(0, maxResults) : rawItems;

		return {
			items: items.map((match) => ({
				path: match.path,
				relativePath: match.relativePath,
				fileName: match.fileName,
				lineNumber: match.lineNumber,
				lineContent: match.lineContent,
				matchRanges: match.matchRanges,
				...(match.contextBefore !== undefined ? { contextBefore: match.contextBefore } : {}),
				...(match.contextAfter !== undefined ? { contextAfter: match.contextAfter } : {}),
				frecencyScore: match.totalFrecencyScore,
				gitStatus: match.gitStatus,
			})),
			totalMatched,
			totalFilesSearched,
			totalFiles,
		};
	}

	search(query: string, opts: SearchOptions = {}): SearchResult {
		this.ensureInitialized();

		const maxResults = opts.maxResults ?? this.config.search.defaultMaxResults;
		const mode = detectSearchMode(query);

		if (mode === "find") {
			return {
				mode: "find",
				findResults: this.find(query, { maxResults }),
			};
		}

		if (mode === "grep") {
			return {
				mode: "grep",
				grepResults: this.grep([query], { maxResults }),
			};
		}

		// Both: run find and grep, return merged results
		return {
			mode: "both",
			findResults: this.find(query, { maxResults }),
			grepResults: this.grep([query], { maxResults }),
		};
	}

	trackFileAccess(query: string, filepath: string): void {
		if (!this.finder) return;
		this.finder.trackQuery(query, filepath);
	}

	private ensureInitialized(): void {
		if (!this.finder) {
			throw new Error("FffService not initialized. Call initialize() first.");
		}
	}
}
