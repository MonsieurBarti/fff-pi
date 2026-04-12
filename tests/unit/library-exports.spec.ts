import { describe, expect, it } from "vitest";

import fffExtension, {
	FffService,
	createAllCommands,
	createAllHooks,
	createAllTools,
} from "../../src/index.js";

describe("fff-pi library exports", () => {
	it("exports FffService as a constructable class with expected methods", () => {
		const service = new FffService();
		expect(service).toBeInstanceOf(FffService);
		expect(typeof service.initialize).toBe("function");
		expect(typeof service.shutdown).toBe("function");
		expect(typeof service.find).toBe("function");
		expect(typeof service.grep).toBe("function");
		expect(typeof service.search).toBe("function");
		expect(typeof service.getStatus).toBe("function");
	});

	it("createAllTools returns a non-empty array of tool definitions", () => {
		const tools = createAllTools(new FffService());
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBeGreaterThan(0);
		for (const tool of tools) {
			expect(typeof tool.name).toBe("string");
			expect(typeof tool.execute).toBe("function");
		}
	});

	it("createAllCommands returns a non-empty array of command definitions", () => {
		const cmds = createAllCommands(new FffService());
		expect(Array.isArray(cmds)).toBe(true);
		expect(cmds.length).toBeGreaterThan(0);
		for (const cmd of cmds) {
			expect(typeof cmd.name).toBe("string");
			expect(typeof cmd.handler).toBe("function");
		}
	});

	it("createAllHooks returns an array of hook definitions", () => {
		const hooks = createAllHooks(new FffService());
		expect(Array.isArray(hooks)).toBe(true);
		for (const hook of hooks) {
			expect(typeof hook.event).toBe("string");
			expect(typeof hook.handler).toBe("function");
		}
	});

	it("default export is still the extension function", () => {
		expect(typeof fffExtension).toBe("function");
	});
});
