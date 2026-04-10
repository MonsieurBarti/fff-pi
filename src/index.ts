import type { TObject } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import type { CommandContext, CommandDefinition } from "./commands";
import { createAllCommands } from "./commands";
import { createAllHooks } from "./hooks";
import { FffService } from "./services/fff-service";
import type { ToolDefinition } from "./tools";
import { createAllTools } from "./tools";

// ---------------------------------------------------------------------------
// Structural PI API — minimal subset of what @mariozechner/pi-coding-agent
// exposes at runtime. We deliberately avoid importing the real type so this
// package can be imported and unit-tested without the peer dep installed.
// ---------------------------------------------------------------------------

type PiEventHandler = (event: unknown, ctx: unknown) => unknown | Promise<unknown>;

interface PiToolExecuteResult {
	content: Array<{ type: "text"; text: string }>;
	details: unknown;
}

interface PiRegisteredTool {
	name: string;
	label: string;
	description: string;
	promptSnippet: string;
	promptGuidelines: string[];
	parameters: unknown;
	execute(toolCallId: string, input: unknown): Promise<PiToolExecuteResult>;
}

interface PiRegisteredCommand {
	description?: string;
	handler(args: string, ctx: PiCommandContext): Promise<void>;
}

interface PiCommandContext {
	ui?: {
		notify?: (message: string, level?: string) => void;
	};
	cwd?: string;
}

export interface PiExtensionApi {
	on(event: string, handler: PiEventHandler): void;
	registerTool(tool: PiRegisteredTool): void;
	registerCommand(name: string, config: PiRegisteredCommand): void;
	cwd?: string;
}

// ---------------------------------------------------------------------------
// Boundary adapters: bridge tool/command definitions to PI's structural shape
// without casts. `wrapTool` uses TypeBox's runtime Value.Check to narrow the
// unknown input to Static<S> before delegating to the typed execute().
// ---------------------------------------------------------------------------

function wrapTool<S extends TObject>(def: ToolDefinition<S>): PiRegisteredTool {
	return {
		name: def.name,
		label: def.label,
		description: def.description,
		promptSnippet: def.promptSnippet,
		promptGuidelines: def.promptGuidelines,
		parameters: def.parameters,
		async execute(toolCallId, input) {
			if (!Value.Check(def.parameters, input)) {
				return {
					content: [
						{
							type: "text",
							text: `Invalid input for ${def.name}`,
						},
					],
					details: { error: "validation-failed" },
				};
			}
			const result = await def.execute(toolCallId, input);
			return {
				content: result.content,
				details: result.details,
			};
		},
	};
}

function wrapCommand(def: CommandDefinition): PiRegisteredCommand {
	return {
		description: def.description,
		async handler(args, piCtx) {
			const ctx: CommandContext = {
				cwd: piCtx.cwd ?? process.cwd(),
				ui: {
					notify: (message, level = "info") => {
						piCtx.ui?.notify?.(message, level);
					},
				},
			};
			await def.handler(args, ctx);
		},
	};
}

// ---------------------------------------------------------------------------
// Default export — called by PI with its ExtensionAPI instance at startup.
// ---------------------------------------------------------------------------

export default function fffExtension(pi: PiExtensionApi): void {
	const service = new FffService();

	// Register all tools + commands.
	for (const def of createAllTools(service)) {
		pi.registerTool(wrapTool(def));
	}
	for (const def of createAllCommands(service)) {
		pi.registerCommand(def.name, wrapCommand(def));
	}

	// Register hooks.
	for (const hook of createAllHooks(service)) {
		pi.on(hook.event, hook.handler);
	}

	// Lifecycle: initialize on session_start, cleanup on session_shutdown.
	pi.on("session_start", async (_event, ctx) => {
		const cwd = (ctx as { cwd?: string })?.cwd ?? pi.cwd ?? process.cwd();
		await service.initialize(cwd);
	});

	pi.on("session_shutdown", async () => {
		await service.shutdown();
	});
}
