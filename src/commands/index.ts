import type { FffService } from "../services/fff-service";
import { createReindexCommand } from "./reindex";
import { createStatusCommand } from "./status";
import type { CommandDefinition } from "./types";

export type { CommandContext, CommandDefinition, CommandUI } from "./types";

export function createAllCommands(service: FffService): CommandDefinition[] {
	return [createStatusCommand(service), createReindexCommand(service)];
}
