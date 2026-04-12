import { describe, expect, test, vi } from "vitest";

import { createTrackFrecencyHook } from "../../../src/hooks/track-frecency.js";
import type { FffService } from "../../../src/services/fff-service.js";

function createMockService(): FffService {
	return {
		trackFileAccess: vi.fn(),
	} as unknown as FffService;
}

describe("track-frecency hook", () => {
	test("has tool_result event type", () => {
		const hook = createTrackFrecencyHook(createMockService());
		expect(hook.event).toBe("tool_result");
	});

	test("tracks file paths from tool result details", () => {
		const service = createMockService();
		const hook = createTrackFrecencyHook(service);

		const event = {
			toolName: "tff-fff_find",
			result: {
				details: {
					items: [{ relativePath: "src/index.ts" }, { relativePath: "src/main.ts" }],
				},
			},
		};

		hook.handler(event, {});
		expect(service.trackFileAccess).toHaveBeenCalledWith("tff-fff_find", "src/index.ts");
		expect(service.trackFileAccess).toHaveBeenCalledWith("tff-fff_find", "src/main.ts");
	});

	test("tracks file path from read tool result", () => {
		const service = createMockService();
		const hook = createTrackFrecencyHook(service);

		const event = {
			toolName: "read",
			args: { path: "src/index.ts" },
			result: { content: [{ type: "text", text: "file content" }] },
		};

		hook.handler(event, {});
		expect(service.trackFileAccess).toHaveBeenCalledWith("read", "src/index.ts");
	});

	test("tracks file path from write tool result", () => {
		const service = createMockService();
		const hook = createTrackFrecencyHook(service);

		const event = {
			toolName: "write",
			args: { path: "src/new-file.ts" },
			result: { content: [{ type: "text", text: "ok" }] },
		};

		hook.handler(event, {});
		expect(service.trackFileAccess).toHaveBeenCalledWith("write", "src/new-file.ts");
	});

	test("ignores events without recognizable file paths", () => {
		const service = createMockService();
		const hook = createTrackFrecencyHook(service);

		hook.handler({ toolName: "bash", result: {} }, {});
		expect(service.trackFileAccess).not.toHaveBeenCalled();
	});

	test("ignores malformed events", () => {
		const service = createMockService();
		const hook = createTrackFrecencyHook(service);

		hook.handler(null, {});
		hook.handler("string", {});
		hook.handler(42, {});
		expect(service.trackFileAccess).not.toHaveBeenCalled();
	});
});
