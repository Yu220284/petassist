import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { APP_CATALOG, type DeskAppId, type PetModelId } from "@/lib/pet-config";

const execFileAsync = promisify(execFile);

export type LlmStatus = {
  ok: boolean;
  model: string | null;
  error?: string;
};

export type LlmRoute = {
  provider: "openai" | "gemini";
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function openaiEnv() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

export function geminiEnv() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const baseUrl = (
    process.env.GEMINI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai"
  ).replace(/\/$/, "");
  return { apiKey, baseUrl };
}

export function probeOpenAi(): LlmStatus {
  const { apiKey, model } = openaiEnv();
  if (!apiKey) return { ok: false, model: null, error: "OPENAI_API_KEY missing" };
  return { ok: true, model };
}

export function probeGemini(): LlmStatus {
  const { apiKey } = geminiEnv();
  if (!apiKey) return { ok: false, model: null, error: "GEMINI_API_KEY missing" };
  return { ok: true, model: "gemini-2.0-flash" };
}

export function routeForModel(id: PetModelId): LlmRoute | { auto: true } {
  if (id === "auto") return { auto: true };
  if (id.startsWith("gemini:")) {
    const { apiKey, baseUrl } = geminiEnv();
    return {
      provider: "gemini",
      apiKey,
      baseUrl,
      model: id.slice("gemini:".length),
    };
  }
  const openai = openaiEnv();
  return {
    provider: "openai",
    apiKey: openai.apiKey ?? "",
    baseUrl: openai.baseUrl,
    model: id.startsWith("openai:") ? id.slice("openai:".length) : openai.model,
  };
}

export async function openMacApp(appId: DeskAppId) {
  const row = APP_CATALOG.find((a) => a.id === appId);
  if (!row) throw new Error(`Unknown app ${appId}`);
  await execFileAsync("open", ["-a", row.bundle], { timeout: 8000 });
  return { ok: true, app: row.bundle };
}
