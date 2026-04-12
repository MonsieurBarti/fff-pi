import type { FffService } from "../services/fff-service.js";
import type { HookDefinition } from "./index.js";

export function createRefreshGitHook(service: FffService): HookDefinition {
	return {
		event: "before_agent_start",
		handler(_event: unknown, _ctx: unknown) {
			try {
				service.refreshGitIfStale();
			} catch {
				// Git refresh is best-effort — don't block the agent
			}
			return undefined;
		},
	};
}
