import { describe, expect, test, vi } from "vitest";

import { createReindexCommand } from "../../../src/commands/reindex.js";
import type { CommandContext } from "../../../src/commands/types.js";
import type { FffService } from "../../../src/services/fff-service.js";

function createMockService(): FffService {
	return {
		reindex: vi.fn().mockResolvedValue(undefined),
	} as unknown as FffService;
}

function createMockCtx(): CommandContext {
	return {
		cwd: "/project",
		ui: { notify: vi.fn() },
	};
}

describe("/fff-reindex command", () => {
	test("has correct name and description", () => {
		const cmd = createReindexCommand(createMockService());
		expect(cmd.name).toBe("fff-reindex");
		expect(cmd.description).toBeTruthy();
	});

	test("calls service.reindex", async () => {
		const service = createMockService();
		const ctx = createMockCtx();
		const cmd = createReindexCommand(service);

		await cmd.handler("", ctx);

		expect(service.reindex).toHaveBeenCalled();
		expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining("complete"), "info");
	});

	test("notifies on error", async () => {
		const service = createMockService();
		vi.mocked(service.reindex).mockRejectedValue(new Error("scan failed"));
		const ctx = createMockCtx();
		const cmd = createReindexCommand(service);

		await cmd.handler("", ctx);

		expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining("scan failed"), "error");
	});
});
