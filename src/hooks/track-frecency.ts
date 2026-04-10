import type { FffService } from "../services/fff-service";
import type { HookDefinition } from "./index";

interface ToolResultEvent {
	toolName: string;
	args?: Record<string, unknown>;
	result?: {
		details?: {
			items?: Array<{ relativePath?: string; path?: string }>;
		};
	};
}

function isToolResultEvent(event: unknown): event is ToolResultEvent {
	return typeof event === "object" && event !== null && "toolName" in event;
}

const FILE_PATH_TOOLS = new Set(["read", "write", "edit"]);

export function createTrackFrecencyHook(service: FffService): HookDefinition {
	return {
		event: "tool_result",
		handler(event: unknown, _ctx: unknown) {
			if (!isToolResultEvent(event)) return undefined;

			const toolName = event.toolName;

			// Track from tool args (read/write/edit have a path arg)
			if (FILE_PATH_TOOLS.has(toolName) && event.args?.path) {
				service.trackFileAccess(toolName, String(event.args.path));
				return undefined;
			}

			// Track from result details (fff tools return items with relativePath)
			const items = event.result?.details?.items;
			if (Array.isArray(items)) {
				for (const item of items) {
					const filePath = item?.relativePath ?? item?.path;
					if (typeof filePath === "string") {
						service.trackFileAccess(toolName, filePath);
					}
				}
			}

			return undefined;
		},
	};
}
