import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_CONFIG, type FffConfig } from "../types";

function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		const targetVal = target[key];
		const sourceVal = source[key];
		if (
			targetVal !== null &&
			sourceVal !== null &&
			typeof targetVal === "object" &&
			typeof sourceVal === "object" &&
			!Array.isArray(targetVal) &&
			!Array.isArray(sourceVal)
		) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>,
			);
		} else {
			result[key] = sourceVal;
		}
	}
	return result;
}

export function getFffDir(cwd: string): string {
	return join(cwd, ".pi", "fff");
}

export function loadConfig(cwd: string): FffConfig {
	const fffDir = getFffDir(cwd);
	mkdirSync(fffDir, { recursive: true });

	const configPath = join(fffDir, "config.json");
	if (!existsSync(configPath)) {
		return structuredClone(DEFAULT_CONFIG);
	}

	try {
		const raw = readFileSync(configPath, "utf-8");
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		return deepMerge(
			structuredClone(DEFAULT_CONFIG) as unknown as Record<string, unknown>,
			parsed,
		) as unknown as FffConfig;
	} catch {
		return structuredClone(DEFAULT_CONFIG);
	}
}
