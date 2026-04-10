import type { FffService } from "../services/fff-service";
import { createInterceptSearchHook } from "./intercept-search";
import { createRefreshGitHook } from "./refresh-git";
import { createTrackFrecencyHook } from "./track-frecency";

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
