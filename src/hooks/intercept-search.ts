import type { FffService } from "../services/fff-service";
import type { HookDefinition } from "./index";

interface ToolCallEvent {
	toolName: string;
	args: Record<string, unknown>;
}

function isToolCallEvent(event: unknown): event is ToolCallEvent {
	return (
		typeof event === "object" &&
		event !== null &&
		"toolName" in event &&
		typeof (event as ToolCallEvent).toolName === "string"
	);
}

function formatFindResult(result: ReturnType<FffService["find"]>): {
	content: Array<{ type: "text"; text: string }>;
	details: unknown;
} {
	const text = result.items.map((item) => item.relativePath).join("\n");

	return {
		content: [{ type: "text", text: text || "No files found." }],
		details: { items: result.items, totalMatched: result.totalMatched },
	};
}

function formatGrepResult(result: ReturnType<FffService["grep"]>): {
	content: Array<{ type: "text"; text: string }>;
	details: unknown;
} {
	const text = result.items
		.map((item) => `${item.relativePath}:${item.lineNumber}: ${item.lineContent}`)
		.join("\n");

	return {
		content: [{ type: "text", text: text || "No matches found." }],
		details: { items: result.items, totalMatched: result.totalMatched },
	};
}

export function createInterceptSearchHook(service: FffService): HookDefinition {
	return {
		event: "tool_call",
		handler(event: unknown, _ctx: unknown) {
			if (!isToolCallEvent(event)) return undefined;

			try {
				if (event.toolName === "glob") {
					const pattern = String(event.args?.pattern ?? "");
					const result = service.find(pattern);
					return formatFindResult(result);
				}

				if (event.toolName === "grep") {
					const pattern = String(event.args?.pattern ?? "");
					const result = service.grep([pattern]);
					return formatGrepResult(result);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text", text: `Search interception error: ${message}` }],
					details: { error: message },
				};
			}

			return undefined;
		},
	};
}
