import type { FffService } from "../services/fff-service.js";
import type { CommandDefinition } from "./types.js";

export function createStatusCommand(service: FffService): CommandDefinition {
	return {
		name: "fff-status",
		description: "Show fff search index status, frecency stats, and git integration state",
		async handler(_args, ctx) {
			const status = service.getStatus();

			if (!status.initialized) {
				ctx.ui.notify("fff: not initialized", "warning");
				return;
			}

			const lines = [
				`fff v${status.version}`,
				`Indexed: ${status.indexedFiles} files`,
				`Path: ${status.basePath}`,
				`Scanning: ${status.isScanning ? "yes" : "no"}`,
				`frecency: ${status.frecencyEnabled ? "enabled" : "disabled"}`,
				`git: ${status.gitAvailable ? (status.gitRepositoryFound ? "repo found" : "available, no repo") : "unavailable"}`,
			];

			ctx.ui.notify(lines.join("\n"), "info");
		},
	};
}
