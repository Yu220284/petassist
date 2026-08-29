export const PET_MODEL_IDS = [
  "auto",
  "openai:gpt-4o-mini",
  "openai:gpt-4o",
  "gemini:gemini-2.0-flash",
  "gemini:gemini-2.5-flash",
] as const;

export type PetModelId = (typeof PET_MODEL_IDS)[number];

export const DESK_APP_IDS = [
  "finder",
  "calendar",
  "mail",
  "notes",
  "slack",
  "safari",
  "chrome",
  "terminal",
] as const;

export type DeskAppId = (typeof DESK_APP_IDS)[number];

export type GatePanel = "policy" | "model" | "tools" | "grants" | "apps";

export type PetConfig = {
  policy: string;
  model: PetModelId;
  disabledTools: string[];
  apps: DeskAppId[];
  hidden: boolean;
};

export const DEFAULT_PET_CONFIG: PetConfig = {
  policy: "",
  model: "auto",
  disabledTools: [],
  apps: [],
  hidden: false,
};

export const MODEL_CATALOG: Array<{
  id: PetModelId;
  provider: "auto" | "openai" | "gemini";
  label: string;
}> = [
  { id: "auto", provider: "auto", label: "Auto" },
  { id: "openai:gpt-4o-mini", provider: "openai", label: "OpenAI · gpt-4o-mini" },
  { id: "openai:gpt-4o", provider: "openai", label: "OpenAI · gpt-4o" },
  { id: "gemini:gemini-2.0-flash", provider: "gemini", label: "Gemini · 2.0 Flash" },
  { id: "gemini:gemini-2.5-flash", provider: "gemini", label: "Gemini · 2.5 Flash" },
];

export const APP_CATALOG: Array<{
  id: DeskAppId;
  bundle: string;
  ja: string;
  en: string;
}> = [
  { id: "finder", bundle: "Finder", ja: "Finder", en: "Finder" },
  { id: "calendar", bundle: "Calendar", ja: "カレンダー", en: "Calendar" },
  { id: "mail", bundle: "Mail", ja: "メール", en: "Mail" },
  { id: "notes", bundle: "Notes", ja: "メモ", en: "Notes" },
  { id: "slack", bundle: "Slack", ja: "Slack", en: "Slack" },
  { id: "safari", bundle: "Safari", ja: "Safari", en: "Safari" },
  { id: "chrome", bundle: "Google Chrome", ja: "Chrome", en: "Chrome" },
  { id: "terminal", bundle: "Terminal", ja: "ターミナル", en: "Terminal" },
];

export const TOOL_CATALOG: Array<{
  name: string;
  pets: Array<"cat" | "bunny" | "dog">;
  ja: string;
  en: string;
}> = [
  { name: "inspect_untrusted", pets: ["cat"], ja: "隔離して開く", en: "Inspect in sandbox" },
  { name: "web_search", pets: ["cat"], ja: "ウェブ検索", en: "Web search" },
  { name: "save_draft", pets: ["bunny"], ja: "下書きを残す", en: "Save draft" },
  { name: "slack_post", pets: ["dog"], ja: "Slack 投稿", en: "Slack post" },
  { name: "list_dir", pets: ["cat", "bunny", "dog"], ja: "フォルダ一覧", en: "List folder" },
  { name: "glob_files", pets: ["cat", "bunny", "dog"], ja: "ファイル検索", en: "Find files" },
  { name: "read_file", pets: ["cat", "bunny", "dog"], ja: "ファイルを読む", en: "Read file" },
  { name: "write_file", pets: ["dog"], ja: "ファイルを書く", en: "Write file" },
  { name: "append_file", pets: ["dog"], ja: "ログ追記", en: "Append log" },
  { name: "write_json", pets: ["dog"], ja: "JSON", en: "JSON" },
  { name: "write_csv", pets: ["dog"], ja: "CSV", en: "CSV" },
  { name: "write_pdf", pets: ["dog"], ja: "PDF", en: "PDF" },
  { name: "write_pptx", pets: ["dog"], ja: "PPTX", en: "PPTX" },
  { name: "process_image", pets: ["dog"], ja: "画像加工", en: "Process image" },
  { name: "copy_file", pets: ["dog"], ja: "コピー", en: "Copy file" },
  { name: "run_command", pets: ["dog"], ja: "コマンド", en: "Shell" },
  { name: "open_app", pets: ["cat", "bunny", "dog"], ja: "アプリを開く", en: "Open app" },
];

export function isPetModelId(value: unknown): value is PetModelId {
  return (PET_MODEL_IDS as readonly string[]).includes(String(value));
}

export function isDeskAppId(value: unknown): value is DeskAppId {
  return (DESK_APP_IDS as readonly string[]).includes(String(value));
}

export function parsePetConfig(raw: unknown): PetConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PET_CONFIG };
  const rec = raw as Record<string, unknown>;
  const apps = Array.isArray(rec.apps)
    ? rec.apps.filter(isDeskAppId)
    : [];
  const disabledTools = Array.isArray(rec.disabledTools)
    ? rec.disabledTools.filter((n): n is string => typeof n === "string")
    : [];
  return {
    policy: typeof rec.policy === "string" ? rec.policy : "",
    model: isPetModelId(rec.model) ? rec.model : "auto",
    disabledTools: [...new Set(disabledTools)],
    apps: [...new Set(apps)],
    hidden: rec.hidden === true,
  };
}

export function usesLlmGateway(config: PetConfig) {
  return config.model !== "auto";
}

export function appBundle(id: DeskAppId) {
  return APP_CATALOG.find((a) => a.id === id)?.bundle ?? id;
}

export function toolsForPetCatalog(petId: string) {
  return TOOL_CATALOG.filter((row) =>
    row.pets.includes(petId as "cat" | "bunny" | "dog")
  );
}
