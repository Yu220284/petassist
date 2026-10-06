"use client";

import {
  defaultConfigFor,
  parsePetConfig,
  type PetConfig,
} from "@/lib/pet-config";
import { readStorage, writeStorage } from "@/lib/storage-key";

const KEY = "petassist.config.v1";
const LEGACY_KEY = "pockassist.config.v1";

export type ConfigMap = Record<string, PetConfig>;

export function loadConfigs(): ConfigMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = readStorage(KEY, [LEGACY_KEY]);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: ConfigMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      out[id] = parsePetConfig(value);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveConfigs(map: ConfigMap) {
  if (typeof window === "undefined") return;
  try {
    writeStorage(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function configFor(map: ConfigMap, petId: string): PetConfig {
  return map[petId] ? parsePetConfig(map[petId]) : defaultConfigFor(petId);
}
