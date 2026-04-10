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

		expect(service.grep).toHaveBeenCalledWith(["TODO"], {
			maxResults: undefined,
			regex: undefined,
			caseSensitive: undefined,
			glob: undefined,
			context: undefined,
		});
		expect(result.content[0]?.text).toContain("src/index.ts");
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
