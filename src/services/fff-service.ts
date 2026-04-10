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
} from "../types";
import { DEFAULT_CONFIG } from "../types";
import { getFffDir, loadConfig } from "./config";

export class FffService {
	private finder: FileFinder | null = null;
	private config: FffConfig = DEFAULT_CONFIG;
	private cwd = "";
	private lastGitRefresh = 0;

	async initialize(cwd: string): Promise<void> {
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
		await this.finder.waitForScan(10_000);
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
		const maxMatchesPerFile = opts.maxResults;

		const sharedOpts = {
			smartCase,
			beforeContext: contextLines,
			afterContext: contextLines,
			...(maxMatchesPerFile !== undefined ? { maxMatchesPerFile } : {}),
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

		const { items, totalMatched, totalFilesSearched, totalFiles } = raw.value;

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
