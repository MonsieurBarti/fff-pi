import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import fffExtension, { type PiExtensionApi } from "../../src/index";

interface RegisteredTool {
	name: string;
	label: string;
	description: string;
	promptSnippet: string;
	promptGuidelines: string[];
	parameters: unknown;
	execute(toolCallId: string, input: unknown): Promise<unknown>;
}

interface RegisteredCommand {
	name: string;
	description?: string;
	handler(args: string, ctx: unknown): Promise<void>;
}

interface CapturedHandler {
	event: string;
	handler: (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
}

function createCapturingPiApi(cwd: string): {
	api: PiExtensionApi;
	tools: RegisteredTool[];
	commands: RegisteredCommand[];
	handlers: CapturedHandler[];
} {
	const tools: RegisteredTool[] = [];
	const commands: RegisteredCommand[] = [];
	const handlers: CapturedHandler[] = [];
	const api: PiExtensionApi = {
		cwd,
		on(event, handler) {
			handlers.push({ event, handler });
		},
		registerTool(tool) {
			tools.push({
				name: tool.name,
				label: tool.label,
				description: tool.description,
				promptSnippet: tool.promptSnippet,
				promptGuidelines: tool.promptGuidelines,
				parameters: tool.parameters,
				execute: tool.execute,
			});
		},
		registerCommand(name, config) {
			const entry: RegisteredCommand = {
				name,
				handler: config.handler,
			};
			if (config.description !== undefined) {
				entry.description = config.description;
			}
			commands.push(entry);
		},
	};
	return { api, tools, commands, handlers };
}

describe("extension entry point", () => {
	let tmpCwd: string;

	beforeEach(() => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-entry-"));
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("default export is a function", () => {
		expect(typeof fffExtension).toBe("function");
	});

	test("registers 3 tools", () => {
		const { api, tools } = createCapturingPiApi(tmpCwd);
		fffExtension(api);
		expect(tools).toHaveLength(3);
	});

	test("registers 2 commands", () => {
		const { api, commands } = createCapturingPiApi(tmpCwd);
		fffExtension(api);
		expect(commands).toHaveLength(2);
	});

	test("subscribes to 0 lifecycle events", () => {
		const { api, handlers } = createCapturingPiApi(tmpCwd);
		fffExtension(api);
		expect(handlers).toHaveLength(0);
	});
});
