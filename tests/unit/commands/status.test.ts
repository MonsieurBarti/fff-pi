import { describe, expect, test, vi } from "vitest";

import { createStatusCommand } from "../../../src/commands/status.js";
import type { CommandContext } from "../../../src/commands/types.js";
import type { FffService } from "../../../src/services/fff-service.js";

function createMockService(): FffService {
	return {
		getStatus: vi.fn().mockReturnValue({
			initialized: true,
			indexedFiles: 1234,
			isScanning: false,
			basePath: "/project",
			frecencyEnabled: true,
			gitAvailable: true,
			gitRepositoryFound: true,
			version: "0.5.1",
		}),
	} as unknown as FffService;
}

function createMockCtx(): CommandContext {
	return {
		cwd: "/project",
		ui: { notify: vi.fn() },
	};
}

describe("/fff-status command", () => {
	test("has correct name and description", () => {
		const cmd = createStatusCommand(createMockService());
		expect(cmd.name).toBe("fff-status");
		expect(cmd.description).toBeTruthy();
	});

	test("displays status via ui.notify", async () => {
		const service = createMockService();
		const ctx = createMockCtx();
		const cmd = createStatusCommand(service);

		await cmd.handler("", ctx);

		expect(ctx.ui.notify).toHaveBeenCalled();
		const message = vi.mocked(ctx.ui.notify).mock.calls[0]?.[0] as string;
		expect(message).toContain("1234");
		expect(message).toContain("0.5.1");
		expect(message).toContain("frecency");
		expect(message).toContain("git");
	});

	test("shows scanning status when isScanning is true", async () => {
		const service = createMockService();
		vi.mocked(service.getStatus).mockReturnValue({
			initialized: true,
			indexedFiles: 500,
			isScanning: true,
			basePath: "/project",
			frecencyEnabled: true,
			gitAvailable: true,
			gitRepositoryFound: true,
			version: "0.5.1",
		});
		const ctx = createMockCtx();
		const cmd = createStatusCommand(service);

		await cmd.handler("", ctx);

		const message = vi.mocked(ctx.ui.notify).mock.calls[0]?.[0] as string;
		expect(message).toContain("yes");
	});

	test("shows 'available, no repo' when git available but no repo found", async () => {
		const service = createMockService();
		vi.mocked(service.getStatus).mockReturnValue({
			initialized: true,
			indexedFiles: 100,
			isScanning: false,
			basePath: "/project",
			frecencyEnabled: false,
			gitAvailable: true,
			gitRepositoryFound: false,
			version: "0.5.0",
		});
		const ctx = createMockCtx();
		const cmd = createStatusCommand(service);

		await cmd.handler("", ctx);

		const message = vi.mocked(ctx.ui.notify).mock.calls[0]?.[0] as string;
		expect(message).toContain("available, no repo");
		expect(message).toContain("disabled");
	});

	test("shows uninitialized status", async () => {
		const service = createMockService();
		vi.mocked(service.getStatus).mockReturnValue({
			initialized: false,
			indexedFiles: 0,
			isScanning: false,
			basePath: "",
			frecencyEnabled: false,
			gitAvailable: false,
			gitRepositoryFound: false,
			version: "unknown",
		});
		const ctx = createMockCtx();
		const cmd = createStatusCommand(service);

		await cmd.handler("", ctx);

		const message = vi.mocked(ctx.ui.notify).mock.calls[0]?.[0] as string;
		expect(message).toContain("not initialized");
	});
});
