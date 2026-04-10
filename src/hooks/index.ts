export interface HookDefinition {
	event: string;
	handler: (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
}

export function createAllHooks(): HookDefinition[] {
	return [];
}
