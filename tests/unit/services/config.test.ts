import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { loadConfig } from "../../../src/services/config.js";
import { DEFAULT_CONFIG } from "../../../src/types.js";

describe("loadConfig", () => {
	let tmpCwd: string;

	beforeEach(() => {
		tmpCwd = mkdtempSync(join(tmpdir(), "fff-config-"));
	});

	afterEach(() => {
		rmSync(tmpCwd, { recursive: true, force: true });
	});

	test("returns default config when no config file exists", () => {
		const config = loadConfig(tmpCwd);
		expect(config).toEqual(DEFAULT_CONFIG);
	});

	test("merges partial config with defaults", () => {
		const configDir = join(tmpCwd, ".pi", "fff");
		mkdirSync(configDir, { recursive: true });
		writeFileSync(
			join(configDir, "config.json"),
			JSON.stringify({
				search: { defaultMaxResults: 50 },
			}),
		);

		const config = loadConfig(tmpCwd);
		expect(config.search.defaultMaxResults).toBe(50);
		expect(config.search.defaultContextLines).toBe(DEFAULT_CONFIG.search.defaultContextLines);
		expect(config.frecency).toEqual(DEFAULT_CONFIG.frecency);
	});

	test("returns default config when config file is invalid JSON", () => {
		const configDir = join(tmpCwd, ".pi", "fff");
		mkdirSync(configDir, { recursive: true });
		writeFileSync(join(configDir, "config.json"), "not json");

		const config = loadConfig(tmpCwd);
		expect(config).toEqual(DEFAULT_CONFIG);
	});

	test("ensures .pi/fff directory exists after load", () => {
		loadConfig(tmpCwd);
		expect(existsSync(join(tmpCwd, ".pi", "fff"))).toBe(true);
	});
});
