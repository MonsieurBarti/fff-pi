import type { FffService } from "../services/fff-service.js";
import { createInterceptSearchHook } from "./intercept-search.js";
import { createRefreshGitHook } from "./refresh-git.js";
import { createTrackFrecencyHook } from "./track-frecency.js";

export interface HookDefinition {
	event: string;
	handler: (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
}

export function createAllHooks(service: FffService): HookDefinition[] {
	return [
		createInterceptSearchHook(service),
		createTrackFrecencyHook(service),
		createRefreshGitHook(service),
	];
}
