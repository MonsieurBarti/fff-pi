import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Use vi.hoisted so fakeFileFinder is available inside the hoisted vi.mock factory
const { fakeFileFinder } = vi.hoisted(() => {
	const finder = {
		fileSearch: vi.fn(),
		grep: vi.fn(),
		multiGrep: vi.fn(),
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
			},
		}),
		getScanProgress: vi.fn().mockReturnValue({
			ok: true,
			value: { scannedFilesCount: 100, isScanning: false },
		}),
		isScanning: vi.fn().mockReturnValue(false),
		destroy: vi.fn(),
		isDestroyed: false,
	};
	return { fakeFileFinder: finder };
});

vi.mock("@ff-labs/fff-node", () => ({
	FileFinder: {
		create: vi.fn().mockReturnValue({ ok: true, value: fakeFileFinder }),
		isAvailable: vi.fn().mockReturnValue(true),
	},
}));

import { FffService } from "../../../src/services/fff-service";

describe("FffService lifecycle", () => {
	let tmpCwd: string;
	let service: FffService;

	beforeEach(() => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-svc-"));
		service = new FffService();
		vi.clearAllMocks();
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("initialize creates FileFinder with correct paths", async () => {
		const { FileFinder } = await import("@ff-labs/fff-node");
		await service.initialize(tmpCwd);

		expect(FileFinder.create).toHaveBeenCalledWith(
			expect.objectContaining({
				basePath: tmpCwd,
				frecencyDbPath: join(tmpCwd, ".pi", "fff", "frecency.db"),
				historyDbPath: join(tmpCwd, ".pi", "fff", "history.db"),
				aiMode: true,
			}),
		);
	});

	test("initialize waits for initial scan", async () => {
		await service.initialize(tmpCwd);
		expect(fakeFileFinder.waitForScan).toHaveBeenCalled();
	});

	test("initialize throws if FileFinder.create fails", async () => {
		const { FileFinder } = await import("@ff-labs/fff-node");
		vi.mocked(FileFinder.create).mockReturnValueOnce({ ok: false, error: "binary not found" });

		await expect(service.initialize(tmpCwd)).rejects.toThrow("binary not found");
	});

	test("shutdown destroys the finder", async () => {
		await service.initialize(tmpCwd);
		await service.shutdown();
		expect(fakeFileFinder.destroy).toHaveBeenCalled();
	});

	test("shutdown is safe to call without initialize", async () => {
		await expect(service.shutdown()).resolves.toBeUndefined();
	});

	test("getStatus returns status after initialization", async () => {
		await service.initialize(tmpCwd);
		const status = service.getStatus();

		expect(status.initialized).toBe(true);
		expect(status.version).toBe("0.5.1");
		expect(status.indexedFiles).toBe(100);
		expect(status.gitAvailable).toBe(true);
	});

	test("getStatus returns uninitialized status before initialize", () => {
		const status = service.getStatus();
		expect(status.initialized).toBe(false);
	});
});

describe("FffService.find", () => {
	let tmpCwd: string;
	let service: FffService;

	beforeEach(async () => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-find-"));
		service = new FffService();
		vi.clearAllMocks();
		fakeFileFinder.fileSearch.mockReturnValue({
			ok: true,
			value: {
				items: [
					{
						path: "/project/src/index.ts",
						relativePath: "src/index.ts",
						fileName: "index.ts",
						totalFrecencyScore: 0,
						gitStatus: "clean",
					},
				],
				scores: [{ total: 100, matchType: "fuzzy" }],
				totalMatched: 1,
				totalFiles: 50,
			},
		});
		await service.initialize(tmpCwd);
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("delegates to FileFinder.fileSearch with mapped options", () => {
		service.find("index", { maxResults: 10 });

		expect(fakeFileFinder.fileSearch).toHaveBeenCalledWith("index", {
			pageSize: 10,
		});
	});

	test("maps FileItem results to FindResultItem", () => {
		const result = service.find("index");

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toEqual(
			expect.objectContaining({
				relativePath: "src/index.ts",
				fileName: "index.ts",
				gitStatus: "clean",
			}),
		);
	});

	test("returns score and frecency from fff-node", () => {
		const result = service.find("index");
		// biome-ignore lint/style/noNonNullAssertion: test assertion on known mock data
		expect(result.items[0]!.score).toBe(100);
		// biome-ignore lint/style/noNonNullAssertion: test assertion on known mock data
		expect(result.items[0]!.frecencyScore).toBe(0);
	});

	test("throws when FileFinder returns error", () => {
		fakeFileFinder.fileSearch.mockReturnValueOnce({ ok: false, error: "search failed" });
		expect(() => service.find("test")).toThrow("search failed");
	});

	test("throws when service not initialized", () => {
		const uninitService = new FffService();
		expect(() => uninitService.find("test")).toThrow("not initialized");
	});
});

describe("FffService.grep", () => {
	let tmpCwd: string;
	let service: FffService;

	beforeEach(async () => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-grep-"));
		service = new FffService();
		vi.clearAllMocks();
		fakeFileFinder.grep.mockReturnValue({
			ok: true,
			value: {
				items: [
					{
						path: "/project/src/index.ts",
						relativePath: "src/index.ts",
						fileName: "index.ts",
						lineNumber: 10,
						lineContent: 'const result = "hello";',
						matchRanges: [[16, 21]],
						contextBefore: [],
						contextAfter: [],
						totalFrecencyScore: 0,
						gitStatus: "clean",
					},
				],
				totalMatched: 1,
				totalFilesSearched: 50,
				totalFiles: 50,
			},
		});
		fakeFileFinder.multiGrep.mockReturnValue({
			ok: true,
			value: {
				items: [],
				totalMatched: 0,
				totalFilesSearched: 0,
				totalFiles: 0,
			},
		});
		await service.initialize(tmpCwd);
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("single pattern delegates to FileFinder.grep", () => {
		service.grep(["TODO"]);

		expect(fakeFileFinder.grep).toHaveBeenCalledWith("TODO", {
			mode: "plain",
			smartCase: true,
			beforeContext: 2,
			afterContext: 2,
		});
	});

	test("multiple patterns delegates to FileFinder.multiGrep", () => {
		service.grep(["TODO", "FIXME"]);

		expect(fakeFileFinder.multiGrep).toHaveBeenCalledWith({
			patterns: ["TODO", "FIXME"],
			smartCase: true,
			beforeContext: 2,
			afterContext: 2,
		});
	});

	test("regex option sets mode to regex", () => {
		service.grep(["foo.*bar"], { regex: true });

		expect(fakeFileFinder.grep).toHaveBeenCalledWith(
			"foo.*bar",
			expect.objectContaining({ mode: "regex" }),
		);
	});

	test("caseSensitive false sets smartCase true", () => {
		service.grep(["test"], { caseSensitive: false });
		expect(fakeFileFinder.grep).toHaveBeenCalledWith(
			"test",
			expect.objectContaining({ smartCase: true }),
		);
	});

	test("caseSensitive true sets smartCase false", () => {
		service.grep(["test"], { caseSensitive: true });
		expect(fakeFileFinder.grep).toHaveBeenCalledWith(
			"test",
			expect.objectContaining({ smartCase: false }),
		);
	});

	test("maps GrepMatch results to GrepResultItem", () => {
		const result = service.grep(["hello"]);

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toEqual(
			expect.objectContaining({
				relativePath: "src/index.ts",
				lineNumber: 10,
				lineContent: 'const result = "hello";',
				matchRanges: [[16, 21]],
				gitStatus: "clean",
			}),
		);
	});

	test("truncates items to maxResults", () => {
		fakeFileFinder.grep.mockReturnValueOnce({
			ok: true,
			value: {
				items: Array.from({ length: 10 }, (_, i) => ({
					path: `/project/src/file${i}.ts`,
					relativePath: `src/file${i}.ts`,
					fileName: `file${i}.ts`,
					lineNumber: i + 1,
					lineContent: "test",
					matchRanges: [[0, 4]],
					contextBefore: [],
					contextAfter: [],
					totalFrecencyScore: 0,
					gitStatus: "clean",
				})),
				totalMatched: 10,
				totalFilesSearched: 10,
				totalFiles: 10,
			},
		});
		const result = service.grep(["test"], { maxResults: 5 });
		expect(result.items).toHaveLength(5);
	});

	test("throws when FileFinder returns error", () => {
		fakeFileFinder.grep.mockReturnValueOnce({ ok: false, error: "grep failed" });
		expect(() => service.grep(["test"])).toThrow("grep failed");
	});
});
