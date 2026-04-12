import { Type } from "@sinclair/typebox";

import type { FffService } from "../services/fff-service.js";
import type { ToolDefinition, ToolDetailValue, ToolExecuteResult } from "./types.js";

const GrepParams = Type.Object({
	patterns: Type.Array(Type.String({ description: "Search pattern" }), {
		minItems: 1,
		description: "One or more patterns to search for (OR logic when multiple)",
	}),
	maxResults: Type.Optional(
		Type.Number({ description: "Maximum results (default: 30)", minimum: 1, maximum: 1000 }),
	),
	regex: Type.Optional(Type.Boolean({ description: "Treat patterns as regex (default: false)" })),
	caseSensitive: Type.Optional(
		Type.Boolean({ description: "Case sensitive search (default: smart case)" }),
	),
	context: Type.Optional(
		Type.Number({
			description: "Lines of context around match (default: 2)",
			minimum: 0,
			maximum: 20,
		}),
	),
});

export function createGrepTool(service: FffService): ToolDefinition<typeof GrepParams> {
	return {
		name: "tff-fff_grep",
		readOnly: true,
		label: "Content Search",
		description:
			"Search file contents with smart case sensitivity, regex support, and multi-pattern OR logic. Results ranked by frecency.",
		promptSnippet:
			"Search file contents for patterns. Supports multiple patterns (OR logic), regex, and smart case.",
		promptGuidelines: [
			"Use for searching inside files by content.",
			"Pass multiple patterns for OR logic — matches any pattern.",
			"Smart case: case-insensitive unless your pattern has uppercase.",
			"Set regex: true for regular expression patterns.",
		],
		parameters: GrepParams,
		async execute(_toolCallId, input): Promise<ToolExecuteResult> {
			try {
				const result = service.grep(input.patterns, {
					...(input.maxResults !== undefined ? { maxResults: input.maxResults } : {}),
					...(input.regex !== undefined ? { regex: input.regex } : {}),
					...(input.caseSensitive !== undefined ? { caseSensitive: input.caseSensitive } : {}),
					...(input.context !== undefined ? { context: input.context } : {}),
				});

				if (result.items.length === 0) {
					return {
						content: [
							{
								type: "text" as const,
								text: `No matches found for: ${input.patterns.join(", ")}`,
							},
						],
						details: { totalMatched: 0, totalFilesSearched: result.totalFilesSearched },
					};
				}

				const lines = result.items.map((item) => {
					let text = `${item.relativePath}:${item.lineNumber}: ${item.lineContent}`;
					if (item.contextBefore?.length) {
						const before = item.contextBefore
							.map(
								(l, i) =>
									`${item.relativePath}:${item.lineNumber - (item.contextBefore?.length ?? 0) + i}: ${l}`,
							)
							.join("\n");
						text = `${before}\n${text}`;
					}
					if (item.contextAfter?.length) {
						const after = item.contextAfter
							.map((l, i) => `${item.relativePath}:${item.lineNumber + 1 + i}: ${l}`)
							.join("\n");
						text = `${text}\n${after}`;
					}
					return text;
				});

				return {
					content: [{ type: "text" as const, text: lines.join("\n---\n") }],
					details: {
						// Safe: all fields are JSON-serializable primitives
						items: result.items as unknown as ToolDetailValue,
						totalMatched: result.totalMatched,
						totalFilesSearched: result.totalFilesSearched,
						totalFiles: result.totalFiles,
					},
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Grep error: ${message}` }],
					details: { error: message },
				};
			}
		},
	};
}
