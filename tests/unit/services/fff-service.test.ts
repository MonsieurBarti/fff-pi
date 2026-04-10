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
