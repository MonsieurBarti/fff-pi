import { Type } from "@sinclair/typebox";

import type { FffService } from "../services/fff-service";
import type { ToolDefinition, ToolDetailValue, ToolExecuteResult } from "./types";

const FindParams = Type.Object({
	query: Type.String({ description: "Fuzzy search query for file names/paths" }),
	maxResults: Type.Optional(
		Type.Number({ description: "Maximum results (default: 20)", minimum: 1, maximum: 1000 }),
	),
});

export function createFindTool(service: FffService): ToolDefinition<typeof FindParams> {
	return {
		name: "tff-fff_find",
		label: "File Find",
		description:
			"Fuzzy find files by name or path. Typo-tolerant with frecency ranking and git-aware boosting. Use this instead of listing directories.",
		promptSnippet: "Find files by name with fuzzy matching, frecency ranking, and git awareness.",
		promptGuidelines: [
			"Use for finding files by name or path.",
			"Supports partial matches and typos.",
			"Results are ranked by relevance, frecency, and git status.",
		],
		parameters: FindParams,
		async execute(_toolCallId, input): Promise<ToolExecuteResult> {
			try {
				const result = service.find(input.query, {
					...(input.maxResults !== undefined ? { maxResults: input.maxResults } : {}),
				});

				const lines = result.items.map(
					(item) =>
						`${item.relativePath} (score: ${item.score}, frecency: ${item.frecencyScore}, git: ${item.gitStatus})`,
				);

				return {
					content: [
						{
							type: "text" as const,
							text:
								result.items.length > 0
									? lines.join("\n")
									: `No files found matching "${input.query}"`,
						},
					],
					details: {
						// Safe: all fields are JSON-serializable primitives
						items: result.items as unknown as ToolDetailValue,
						totalMatched: result.totalMatched,
						totalFiles: result.totalFiles,
					},
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Find error: ${message}` }],
					details: { error: message },
				};
			}
		},
	};
}
