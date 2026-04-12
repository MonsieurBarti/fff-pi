import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// vi.hoisted so the factory is available inside the hoisted vi.mock block
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

import fffExtension, { type PiExtensionApi } from "../../src/index.js";

interface RegisteredTool {
	name: string;
}

interface RegisteredCommand {
	name: string;
}

interface CapturedHandler {
	event: string;
	handler: (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
}

function createCapturingPiApi(cwd: string): {
	api: PiExtensionApi;
	tools: RegisteredTool[];
	commands: RegisteredCommand[];
	handlers: CapturedHandler[];
} {
	const tools: RegisteredTool[] = [];
	const commands: RegisteredCommand[] = [];
	const handlers: CapturedHandler[] = [];
	const api: PiExtensionApi = {
		cwd,
		on(event, handler) {
			handlers.push({ event, handler });
		},
		registerTool(tool) {
			tools.push({ name: tool.name });
		},
		registerCommand(name, _config) {
			commands.push({ name });
		},
		exec: async () => ({ stdout: "", code: 0 }),
	};
	return { api, tools, commands, handlers };
}

describe("extension entry point", () => {
	let tmpCwd: string;

	beforeEach(() => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-entry-"));
		vi.clearAllMocks();
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("default export is a function", () => {
		expect(typeof fffExtension).toBe("function");
	});

	test("registers 3 tools", () => {
		const { api, tools } = createCapturingPiApi(tmpCwd);
		fffExtension(api);
		expect(tools).toHaveLength(3);
		expect(tools.map((t) => t.name)).toEqual(["tff-fff_find", "tff-fff_grep", "tff-fff_search"]);
	});

	test("registers 2 commands", () => {
		const { api, commands } = createCapturingPiApi(tmpCwd);
		fffExtension(api);
		expect(commands).toHaveLength(2);
		expect(commands.map((c) => c.name)).toEqual(["fff-status", "fff-reindex"]);
	});

	test("subscribes to lifecycle events", () => {
		const { api, handlers } = createCapturingPiApi(tmpCwd);
		fffExtension(api);

		const events = handlers.map((h) => h.event);
		expect(events).toContain("session_start");
		expect(events).toContain("session_shutdown");
		expect(events).toContain("tool_call");
		expect(events).toContain("tool_result");
		expect(events).toContain("before_agent_start");
	});
});
