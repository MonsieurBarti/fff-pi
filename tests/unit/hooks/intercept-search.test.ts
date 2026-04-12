import { describe, expect, test, vi } from "vitest";

import { createInterceptSearchHook } from "../../../src/hooks/intercept-search.js";
import type { FffService } from "../../../src/services/fff-service.js";

function createMockService(): FffService {
	return {
		find: vi.fn().mockReturnValue({
			items: [
				{
					relativePath: "src/index.ts",
					fileName: "index.ts",
					score: 100,
					frecencyScore: 0,
					gitStatus: "clean",
					matchType: "exact",
				},
			],
			totalMatched: 1,
			totalFiles: 50,
		}),
		grep: vi.fn().mockReturnValue({
			items: [
				{
					relativePath: "src/index.ts",
					lineNumber: 10,
					lineContent: "const x = 1;",
					matchRanges: [[6, 7]],
					frecencyScore: 0,
					gitStatus: "clean",
				},
			],
			totalMatched: 1,
			totalFilesSearched: 10,
			totalFiles: 50,
		}),
	} as unknown as FffService;
}

describe("intercept-search hook", () => {
	test("has tool_call event type", () => {
		const hook = createInterceptSearchHook(createMockService());
		expect(hook.event).toBe("tool_call");
	});

	test("intercepts glob tool call and reroutes to find", () => {
		const service = createMockService();
		const hook = createInterceptSearchHook(service);
		const event = {
			toolName: "glob",
			args: { pattern: "**/*.ts", path: "/project" },
		};

		const result = hook.handler(event, {});
		expect(service.find).toHaveBeenCalledWith("**/*.ts");
		expect(result).toEqual(
			expect.objectContaining({
				content: expect.arrayContaining([expect.objectContaining({ type: "text" })]),
			}),
		);
	});

	test("intercepts grep tool call and reroutes to grep", () => {
		const service = createMockService();
		const hook = createInterceptSearchHook(service);
		const event = {
			toolName: "grep",
			args: { pattern: "TODO", path: "/project" },
		};

		const result = hook.handler(event, {});
		expect(service.grep).toHaveBeenCalledWith(["TODO"]);
		expect(result).toBeDefined();
	});

	test("returns undefined for non-search tools", () => {
		const service = createMockService();
		const hook = createInterceptSearchHook(service);
		const event = { toolName: "read", args: { path: "/file.txt" } };

		const result = hook.handler(event, {});
		expect(result).toBeUndefined();
		expect(service.find).not.toHaveBeenCalled();
		expect(service.grep).not.toHaveBeenCalled();
	});

	test("returns undefined for malformed event", () => {
		const service = createMockService();
		const hook = createInterceptSearchHook(service);
		const result = hook.handler("not an object", {});
		expect(result).toBeUndefined();
	});

	test("returns error content when service throws a non-initialization error", () => {
		const service = createMockService();
		vi.mocked(service.find).mockImplementation(() => {
			throw new Error("disk read failed");
		});
		const hook = createInterceptSearchHook(service);
		const event = { toolName: "glob", args: { pattern: "*.ts" } };

		const result = hook.handler(event, {}) as { content: Array<{ text: string }> };
		expect(result.content[0]?.text).toContain("disk read failed");
	});

	test("returns undefined when service throws 'not initialized' (falls through to PI handler)", () => {
		const service = createMockService();
		vi.mocked(service.find).mockImplementation(() => {
			throw new Error("FffService not initialized. Call initialize() first.");
		});
		const hook = createInterceptSearchHook(service);
		const event = { toolName: "glob", args: { pattern: "*.ts" } };

		const result = hook.handler(event, {});
		expect(result).toBeUndefined();
	});
});
