import { Value } from "@sinclair/typebox/value";
import { describe, expect, test, vi } from "vitest";

import type { FffService } from "../../../src/services/fff-service";
import { createFindTool } from "../../../src/tools/find";

function createMockService(): FffService {
	return {
		find: vi.fn().mockReturnValue({
			items: [
				{
					path: "/project/src/index.ts",
					relativePath: "src/index.ts",
					fileName: "index.ts",
					score: 100,
					frecencyScore: 5.2,
					gitStatus: "modified",
					matchType: "exact",
				},
			],
			totalMatched: 1,
			totalFiles: 50,
		}),
	} as unknown as FffService;
}

describe("tff-fff_find tool", () => {
	test("has correct name and metadata", () => {
		const tool = createFindTool(createMockService());
		expect(tool.name).toBe("tff-fff_find");
		expect(tool.label).toBeTruthy();
		expect(tool.description).toBeTruthy();
	});

	test("schema validates correct input", () => {
		const tool = createFindTool(createMockService());
		const valid = Value.Check(tool.parameters, { query: "index.ts" });
		expect(valid).toBe(true);
	});

	test("schema validates input with all options", () => {
		const tool = createFindTool(createMockService());
		const valid = Value.Check(tool.parameters, {
			query: "index",
			maxResults: 10,
			editDistance: 1,
			glob: "*.ts",
			includeHidden: true,
		});
		expect(valid).toBe(true);
	});

	test("schema rejects missing query", () => {
		const tool = createFindTool(createMockService());
		const valid = Value.Check(tool.parameters, {});
		expect(valid).toBe(false);
	});

	test("execute calls service.find and formats result", async () => {
		const service = createMockService();
		const tool = createFindTool(service);
		const result = await tool.execute("call-1", { query: "index" });

		expect(service.find).toHaveBeenCalledWith("index", {
			maxResults: undefined,
			editDistance: undefined,
			glob: undefined,
			includeHidden: undefined,
		});
		expect(result.content[0]?.text).toContain("src/index.ts");
		expect(result.details).toEqual(expect.objectContaining({ totalMatched: 1, totalFiles: 50 }));
	});

	test("execute returns error content on service failure", async () => {
		const service = createMockService();
		vi.mocked(service.find).mockImplementation(() => {
			throw new Error("index not ready");
		});
		const tool = createFindTool(service);
		const result = await tool.execute("call-1", { query: "test" });

		expect(result.content[0]?.text).toContain("index not ready");
		expect(result.details).toEqual(expect.objectContaining({ error: "index not ready" }));
	});
});
