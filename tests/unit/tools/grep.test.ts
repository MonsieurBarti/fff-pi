import { Value } from "@sinclair/typebox/value";
import { describe, expect, test, vi } from "vitest";

import type { FffService } from "../../../src/services/fff-service";
import { createGrepTool } from "../../../src/tools/grep";

function createMockService(): FffService {
	return {
		grep: vi.fn().mockReturnValue({
			items: [
				{
					path: "/project/src/index.ts",
					relativePath: "src/index.ts",
					fileName: "index.ts",
					lineNumber: 10,
					lineContent: "// TODO: fix this",
					matchRanges: [[3, 7]],
					contextBefore: ["function main() {"],
					contextAfter: ["  return null;"],
					frecencyScore: 2.5,
					gitStatus: "clean",
				},
			],
			totalMatched: 1,
			totalFilesSearched: 10,
			totalFiles: 50,
		}),
	} as unknown as FffService;
}

describe("tff-fff_grep tool", () => {
	test("has correct name and metadata", () => {
		const tool = createGrepTool(createMockService());
		expect(tool.name).toBe("tff-fff_grep");
	});

	test("schema validates single pattern", () => {
		const tool = createGrepTool(createMockService());
		expect(Value.Check(tool.parameters, { patterns: ["TODO"] })).toBe(true);
	});

	test("schema validates multiple patterns", () => {
		const tool = createGrepTool(createMockService());
		expect(Value.Check(tool.parameters, { patterns: ["TODO", "FIXME"], regex: false })).toBe(true);
	});

	test("schema rejects empty patterns array", () => {
		const tool = createGrepTool(createMockService());
		expect(Value.Check(tool.parameters, { patterns: [] })).toBe(false);
	});

	test("schema rejects missing patterns", () => {
		const tool = createGrepTool(createMockService());
		expect(Value.Check(tool.parameters, {})).toBe(false);
	});

	test("execute calls service.grep and formats result", async () => {
		const service = createMockService();
		const tool = createGrepTool(service);
		const result = await tool.execute("call-1", { patterns: ["TODO"] });

		expect(service.grep).toHaveBeenCalledWith(["TODO"], {});
		expect(result.content[0]?.text).toContain("src/index.ts");
		expect(result.content[0]?.text).toContain("TODO: fix this");
	});

	test("execute returns 'no matches' message when items is empty", async () => {
		const service = createMockService();
		vi.mocked(service.grep).mockReturnValue({
			items: [],
			totalMatched: 0,
			totalFilesSearched: 10,
			totalFiles: 50,
		});
		const tool = createGrepTool(service);
		const result = await tool.execute("call-1", { patterns: ["nonexistent"] });

		expect(result.content[0]?.text).toContain("No matches found for: nonexistent");
	});

	test("execute passes all optional parameters to service.grep", async () => {
		const service = createMockService();
		vi.mocked(service.grep).mockReturnValue({
			items: [],
			totalMatched: 0,
			totalFilesSearched: 5,
			totalFiles: 50,
		});
		const tool = createGrepTool(service);
		await tool.execute("call-1", {
			patterns: ["TODO"],
			maxResults: 5,
			regex: true,
			caseSensitive: false,
			context: 3,
		});

		expect(service.grep).toHaveBeenCalledWith(["TODO"], {
			maxResults: 5,
			regex: true,
			caseSensitive: false,
			context: 3,
		});
	});

	test("execute formats context lines when contextBefore and contextAfter are present", async () => {
		const service = createMockService();
		vi.mocked(service.grep).mockReturnValue({
			items: [
				{
					path: "/project/src/index.ts",
					relativePath: "src/index.ts",
					fileName: "index.ts",
					lineNumber: 10,
					lineContent: "// TODO: fix this",
					matchRanges: [[3, 7]],
					contextBefore: ["function main() {"],
					contextAfter: ["  return null;"],
					frecencyScore: 2.5,
					gitStatus: "clean",
				},
			],
			totalMatched: 1,
			totalFilesSearched: 10,
			totalFiles: 50,
		});
		const tool = createGrepTool(service);
		const result = await tool.execute("call-1", { patterns: ["TODO"] });

		// Context before should appear before match line
		expect(result.content[0]?.text).toContain("function main() {");
		// Context after should appear after match line
		expect(result.content[0]?.text).toContain("return null;");
		// The match itself
		expect(result.content[0]?.text).toContain("TODO: fix this");
	});

	test("execute returns error content on service failure", async () => {
		const service = createMockService();
		vi.mocked(service.grep).mockImplementation(() => {
			throw new Error("grep failed");
		});
		const tool = createGrepTool(service);
		const result = await tool.execute("call-1", { patterns: ["test"] });

		expect(result.content[0]?.text).toContain("grep failed");
	});
});
