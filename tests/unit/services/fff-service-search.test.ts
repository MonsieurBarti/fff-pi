import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
	createFakeFileItem,
	createFakeGrepMatch,
	createFakeGrepResult,
	createFakeSearchResult,
} from "../../fixtures/fake-fff-node";

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

describe("FffService.search auto-mode", () => {
	let tmpCwd: string;
	let service: FffService;

	beforeEach(async () => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-search-"));
		service = new FffService();
		vi.clearAllMocks();
		fakeFileFinder.fileSearch.mockReturnValue(createFakeSearchResult([createFakeFileItem()]));
		fakeFileFinder.grep.mockReturnValue(createFakeGrepResult([createFakeGrepMatch()]));
		await service.initialize(tmpCwd);
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("routes to find when query contains /", () => {
		const result = service.search("src/index");
		expect(result.mode).toBe("find");
		expect(result.findResults).toBeDefined();
		expect(result.grepResults).toBeUndefined();
	});

	test("routes to find when query has file extension", () => {
		const result = service.search("index.ts");
		expect(result.mode).toBe("find");
	});

	test("routes to find when query contains glob chars", () => {
		const result = service.search("*.ts");
		expect(result.mode).toBe("find");
	});

	test("routes to grep when query contains regex metacharacters", () => {
		const result = service.search("foo\\(bar\\)");
		expect(result.mode).toBe("grep");
		expect(result.grepResults).toBeDefined();
		expect(result.findResults).toBeUndefined();
	});

	test("routes to grep when query contains whitespace", () => {
		const result = service.search("const result");
		expect(result.mode).toBe("grep");
	});

	test("routes to grep when query contains pipe", () => {
		const result = service.search("foo|bar");
		expect(result.mode).toBe("grep");
	});

	test("runs both for ambiguous single word", () => {
		const result = service.search("handler");
		expect(result.mode).toBe("both");
		expect(result.findResults).toBeDefined();
		expect(result.grepResults).toBeDefined();
	});
});
