import { describe, expect, it } from "vitest";

import { FffService } from "../../src/services/fff-service";

describe("FffService.initialize() abort support", () => {
	it("rejects with AbortError when signal is already aborted", async () => {
		const service = new FffService();
		const ctrl = new AbortController();
		ctrl.abort();

		await expect(service.initialize(process.cwd(), { signal: ctrl.signal })).rejects.toMatchObject({
			name: "AbortError",
		});
	});

	it("works normally when no signal is supplied", async () => {
		const service = new FffService();
		await expect(service.initialize(process.cwd())).resolves.toBeUndefined();
		await service.shutdown();
	});

	it("works normally when signal is not aborted", async () => {
		const service = new FffService();
		const ctrl = new AbortController();
		await expect(
			service.initialize(process.cwd(), { signal: ctrl.signal }),
		).resolves.toBeUndefined();
		await service.shutdown();
	});
});
