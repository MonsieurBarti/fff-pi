import { describe, expect, test, vi } from "vitest";

import { createRefreshGitHook } from "../../../src/hooks/refresh-git";
import type { FffService } from "../../../src/services/fff-service";

function createMockService(): FffService {
	return {
		refreshGitIfStale: vi.fn(),
	} as unknown as FffService;
}

describe("refresh-git hook", () => {
	test("has before_agent_start event type", () => {
		const hook = createRefreshGitHook(createMockService());
		expect(hook.event).toBe("before_agent_start");
	});

	test("calls refreshGitIfStale on the service", () => {
		const service = createMockService();
		const hook = createRefreshGitHook(service);

		hook.handler({}, {});
		expect(service.refreshGitIfStale).toHaveBeenCalled();
	});

	test("does not throw if refreshGitIfStale throws", () => {
		const service = createMockService();
		vi.mocked(service.refreshGitIfStale).mockImplementation(() => {
			throw new Error("git error");
		});
		const hook = createRefreshGitHook(service);

		expect(() => hook.handler({}, {})).not.toThrow();
	});
});
