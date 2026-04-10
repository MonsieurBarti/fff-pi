import { join } from "node:path";

import { FileFinder } from "@ff-labs/fff-node";

import type { FffConfig, IndexStatus } from "../types";
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
