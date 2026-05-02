import { t } from "../i18n.js";
import type { FffService } from "../services/fff-service.js";
import type { CommandDefinition } from "./types.js";

export function createStatusCommand(service: FffService): CommandDefinition {
	return {
		name: "fff-status",
		description: "Show fff search index status, frecency stats, and git integration state",
		async handler(_args, ctx) {
			const status = service.getStatus();

			if (!status.initialized) {
				ctx.ui.notify(t("status.notInitialized", "fff: not initialized"), "warning");
				return;
			}

			const yes = t("value.yes", "yes");
			const no = t("value.no", "no");
			const enabled = t("value.enabled", "enabled");
			const disabled = t("value.disabled", "disabled");
			const gitState = status.gitAvailable
				? status.gitRepositoryFound
					? t("value.repoFound", "repo found")
					: t("value.availableNoRepo", "available, no repo")
				: t("value.unavailable", "unavailable");

			const lines = [
				t("status.version", "fff v{version}", { version: status.version }),
				t("status.indexed", "Indexed: {count} files", { count: status.indexedFiles }),
				t("status.path", "Path: {path}", { path: status.basePath }),
				t("status.scanning", "Scanning: {value}", { value: status.isScanning ? yes : no }),
				t("status.frecency", "frecency: {value}", { value: status.frecencyEnabled ? enabled : disabled }),
				t("status.git", "git: {value}", { value: gitState }),
			];

			ctx.ui.notify(lines.join("\n"), "info");
		},
	};
}
