import type { FffService } from "../services/fff-service.js";
import { createReindexCommand } from "./reindex.js";
import { createStatusCommand } from "./status.js";
import type { CommandDefinition } from "./types.js";

export type { CommandContext, CommandDefinition, CommandUI } from "./types.js";

export function createAllCommands(service: FffService): CommandDefinition[] {
	return [createStatusCommand(service), createReindexCommand(service)];
}
