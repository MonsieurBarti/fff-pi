import { Value } from "@sinclair/typebox/value";
import { describe, expect, test, vi } from "vitest";

import type { FffService } from "../../../src/services/fff-service.js";
import { createSearchTool } from "../../../src/tools/search.js";

function createMockService(): FffService {
	return {
		search: vi.fn().mockReturnValue({
			mode: "find",
			findResults: {
				items: [
					{
						path: "/project/src/index.ts",
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
			},
		}),
	} as unknown as FffService;
}

describe("tff-fff_search tool", () => {
	test("has correct name", () => {
		const tool = createSearchTool(createMockService());
		expect(tool.name).toBe("tff-fff_search");
	});

	test("schema validates minimal input", () => {
		const tool = createSearchTool(createMockService());
		expect(Value.Check(tool.parameters, { query: "hello" })).toBe(true);
	});

	test("schema validates with maxResults", () => {
		const tool = createSearchTool(createMockService());
		expect(Value.Check(tool.parameters, { query: "hello", maxResults: 5 })).toBe(true);
	});

	test("schema rejects missing query", () => {
		const tool = createSearchTool(createMockService());
		expect(Value.Check(tool.parameters, {})).toBe(false);
	});

	test("execute calls service.search and includes mode in output", async () => {
		const service = createMockService();
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "index.ts" });

		expect(service.search).toHaveBeenCalledWith("index.ts", { maxResults: undefined });
		expect(result.content[0]?.text).toContain("src/index.ts");
		expect(result.details).toEqual(expect.objectContaining({ mode: "find" }));
	});

	test("execute handles both mode with merged results", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockReturnValue({
			mode: "both",
			findResults: {
				items: [
					{
						path: "/p/handler.ts",
						relativePath: "handler.ts",
						fileName: "handler.ts",
						score: 80,
						frecencyScore: 0,
						gitStatus: "clean",
						matchType: "fuzzy",
					},
				],
				totalMatched: 1,
				totalFiles: 50,
			},
			grepResults: {
				items: [
					{
						path: "/p/src/main.ts",
						relativePath: "src/main.ts",
						fileName: "main.ts",
						lineNumber: 5,
						lineContent: "function handler() {}",
						matchRanges: [[9, 16]],
						frecencyScore: 0,
						gitStatus: "clean",
					},
				],
				totalMatched: 1,
				totalFilesSearched: 10,
				totalFiles: 50,
			},
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "handler" });

		expect(result.content[0]?.text).toContain("Files:");
		expect(result.content[0]?.text).toContain("Content:");
		expect(result.details).toEqual(expect.objectContaining({ mode: "both" }));
	});

	test("execute handles grep-only mode", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockReturnValue({
			mode: "grep",
			grepResults: {
				items: [
					{
						path: "/p/src/main.ts",
						relativePath: "src/main.ts",
						fileName: "main.ts",
						lineNumber: 5,
						lineContent: "const foo = 1;",
						matchRanges: [[6, 9]],
						frecencyScore: 0,
						gitStatus: "clean",
					},
				],
				totalMatched: 1,
				totalFilesSearched: 10,
				totalFiles: 50,
			},
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "const foo" });

		expect(result.content[0]?.text).toContain("src/main.ts");
		expect(result.details).toEqual(expect.objectContaining({ mode: "grep" }));
	});

	test("execute returns no-results message when find mode returns empty items", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockReturnValue({
			mode: "find",
			findResults: {
				items: [],
				totalMatched: 0,
				totalFiles: 50,
			},
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "nope.ts" });

		expect(result.content[0]?.text).toContain('No files found matching "nope.ts"');
	});

	test("execute returns no-results message when grep mode returns empty items", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockReturnValue({
			mode: "grep",
			grepResults: {
				items: [],
				totalMatched: 0,
				totalFilesSearched: 5,
				totalFiles: 50,
			},
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "nothing here" });

		expect(result.content[0]?.text).toContain('No content matches for "nothing here"');
	});

	test("execute returns no-results message when both mode returns empty results", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockReturnValue({
			mode: "both",
			findResults: { items: [], totalMatched: 0, totalFiles: 50 },
			grepResults: { items: [], totalMatched: 0, totalFilesSearched: 5, totalFiles: 50 },
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "handler" });

		expect(result.content[0]?.text).toContain('No results found for "handler"');
	});

	test("execute returns error on failure", async () => {
		const service = createMockService();
		vi.mocked(service.search).mockImplementation(() => {
			throw new Error("not ready");
		});
		const tool = createSearchTool(service);
		const result = await tool.execute("call-1", { query: "test" });

		expect(result.content[0]?.text).toContain("not ready");
	});
});
