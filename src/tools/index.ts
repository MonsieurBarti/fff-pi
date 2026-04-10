import type { FffService } from "../services/fff-service";
import { createFindTool } from "./find";
import { createGrepTool } from "./grep";
import { createSearchTool } from "./search";
import type { ToolDefinition } from "./types";

export type { ToolDefinition, ToolDetailValue, ToolExecuteResult } from "./types";

export function createAllTools(service: FffService): ToolDefinition[] {
	return [createFindTool(service), createGrepTool(service), createSearchTool(service)];
}
