import type { FffService } from "../services/fff-service.js";
import { createFindTool } from "./find.js";
import { createGrepTool } from "./grep.js";
import { createSearchTool } from "./search.js";
import type { ToolDefinition } from "./types.js";

export type { ToolDefinition, ToolDetailValue, ToolExecuteResult } from "./types.js";

export function createAllTools(service: FffService): ToolDefinition[] {
	return [createFindTool(service), createGrepTool(service), createSearchTool(service)];
}
