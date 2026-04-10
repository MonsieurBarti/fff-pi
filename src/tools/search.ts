import { Type } from "@sinclair/typebox";

import type { FffService } from "../services/fff-service";
import type { FindResult, GrepResult } from "../types";
import type { ToolDefinition, ToolDetailValue, ToolExecuteResult } from "./types";

const SearchParams = Type.Object({
	query: Type.String({ description: "Natural language query or pattern" }),
	maxResults: Type.Optional(Type.Number({ description: "Maximum results (default: 20)" })),
});

function formatFindResults(results: FindResult): string {
	return results.items
		.map(
			(item) =>
				`${item.relativePath} (score: ${item.score}, frecency: ${item.frecencyScore}, git: ${item.gitStatus})`,
		)
		.join("\n");
}

function formatGrepResults(results: GrepResult): string {
	return results.items
		.map((item) => `${item.relativePath}:${item.lineNumber}: ${item.lineContent}`)
		.join("\n");
}

export function createSearchTool(service: FffService): ToolDefinition<typeof SearchParams> {
	return {
		name: "tff-fff_search",
		label: "Smart Search",
		description:
			"Smart search that auto-detects whether to find files or search contents. Use when unsure which search type to use.",
		promptSnippet:
			"Unified search — automatically decides whether to find files by name or search file contents.",
		promptGuidelines: [
			"Use when you're not sure if you need file search or content search.",
			"Paths and extensions route to file find, code patterns route to content grep.",
			"Ambiguous queries run both and merge results.",
		],
		parameters: SearchParams,
		async execute(_toolCallId, input): Promise<ToolExecuteResult> {
			try {
				const result = service.search(input.query, {
					maxResults: input.maxResults,
				} as { maxResults?: number });
				let text: string;

				if (result.mode === "find" && result.findResults) {
					text =
						result.findResults.items.length > 0
							? formatFindResults(result.findResults)
							: `No files found matching "${input.query}"`;
				} else if (result.mode === "grep" && result.grepResults) {
					text =
						result.grepResults.items.length > 0
							? formatGrepResults(result.grepResults)
							: `No content matches for "${input.query}"`;
				} else if (result.mode === "both") {
					const sections: string[] = [];
					if (result.findResults && result.findResults.items.length > 0) {
						sections.push(`Files:\n${formatFindResults(result.findResults)}`);
					}
					if (result.grepResults && result.grepResults.items.length > 0) {
						sections.push(`Content:\n${formatGrepResults(result.grepResults)}`);
					}
					text =
						sections.length > 0 ? sections.join("\n\n") : `No results found for "${input.query}"`;
				} else {
					text = `No results found for "${input.query}"`;
				}

				return {
					content: [{ type: "text" as const, text }],
					details: {
						// Safe: all fields are JSON-serializable primitives
						mode: result.mode as unknown as ToolDetailValue,
						findResults: result.findResults as unknown as ToolDetailValue,
						grepResults: result.grepResults as unknown as ToolDetailValue,
					},
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Search error: ${message}` }],
					details: { error: message },
				};
			}
		},
	};
}
