import type { FffService } from "../services/fff-service";
import type { CommandDefinition } from "./types";

export function createReindexCommand(service: FffService): CommandDefinition {
	return {
		name: "fff-reindex",
		description: "Force rebuild of the fff file index. Frecency data is preserved.",
		async handler(_args, ctx) {
			try {
				ctx.ui.notify("fff: reindexing...", "info");
				await service.reindex();
				ctx.ui.notify("fff: reindex complete", "info");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`fff: reindex failed — ${message}`, "error");
			}
		},
	};
}
