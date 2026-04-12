import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FffService } from "../../src/services/fff-service";

describe("FffService.initialize() abort support", () => {
	let tmpCwd: string;

	beforeEach(() => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-abort-"));
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	it("rejects with AbortError when signal is already aborted", async () => {
		const service = new FffService();
		const ctrl = new AbortController();
		ctrl.abort();

		await expect(service.initialize(tmpCwd, { signal: ctrl.signal })).rejects.toMatchObject({
			name: "AbortError",
		});
	});

	it("works normally when no signal is supplied", async () => {
		const service = new FffService();
		await expect(service.initialize(tmpCwd)).resolves.toBeUndefined();
		await service.shutdown();
	});

	it("works normally when signal is not aborted", async () => {
		const service = new FffService();
		const ctrl = new AbortController();
		await expect(service.initialize(tmpCwd, { signal: ctrl.signal })).resolves.toBeUndefined();
		await service.shutdown();
	});
});
