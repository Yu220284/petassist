import type { PartyMember, PartyStatus } from "@/data/party";

const FRAMES = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;

export function coatPath(petId: string, frame: string) {
  return `/party/${petId}/${frame}.png`;
}

export function coatsFor(petId: string) {
  return FRAMES.map((frame) => coatPath(petId, frame));
}

export const DEFAULT_ACCENT: Record<string, string> = {
  cat: "#e8a07a",
  penguin: "#6ba8c9",
  bunny: "#e7a4b6",
  dog: "#d4b15a",
  chick: "#e3c45a",
  raccoondog: "#b7a894",
};

/**
 * Drop failed/stopped art later, then point these paths at the files.
 * Until then spriteFor falls back to the chosen coat.
 */
export const FACE_FILES: Record<
  string,
  Partial<Record<"failed" | "stopped", string>>
> = {};

export function spriteFor(member: PartyMember): string {
  const faces = FACE_FILES[member.id];
  if (member.status === "failed" && faces?.failed) return faces.failed;
  if (member.status === "stopped" && faces?.stopped) return faces.stopped;
  return member.icon;
}

export function gaugeFill(
  status: PartyStatus,
  accent: string
): string {
  if (status === "failed") return "#dc2626";
  if (status === "stopped") return "#94a3b8";
  if (status === "need_approval") return "#ea580c";
  return accent;
}
