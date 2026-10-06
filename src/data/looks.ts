import type { PartyMember, PartyStatus } from "@/data/party";

const FRAMES = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;

export function coatPath(petId: string, frame: string) {
  return `/party/${petId}/${frame}.webp`;
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
 * Failed faces live next to each coat: `/party/{id}/failed-02.webp`.
 * Color variants are matched per coat so the expression can change
 * without swapping fur color or jumping in size.
 */
export function failedSpriteFor(member: PartyMember): string | null {
  const match = member.icon.match(/\/party\/([^/]+)\/(\d{2})\.webp$/);
  if (!match) return null;
  return `/party/${match[1]}/failed-${match[2]}.webp`;
}

export const FACE_FILES: Record<
  string,
  Partial<Record<"failed" | "stopped", string>>
> = {
  cat: { failed: "/party/cat/failed-02.webp" },
  penguin: { failed: "/party/penguin/failed-04.webp" },
  bunny: { failed: "/party/bunny/failed-02.webp" },
  dog: { failed: "/party/dog/failed-09.webp" },
  chick: { failed: "/party/chick/failed-02.webp" },
  raccoondog: { failed: "/party/raccoondog/failed-06.webp" },
};

export function spriteFor(member: PartyMember, opts?: { asleep?: boolean }): string {
  if (opts?.asleep || member.status === "failed") {
    return failedSpriteFor(member) ?? FACE_FILES[member.id]?.failed ?? member.icon;
  }
  const faces = FACE_FILES[member.id];
  if (member.status === "stopped" && faces?.stopped) return faces.stopped;
  return member.icon;
}

export function gaugeFill(
  status: PartyStatus,
  accent: string
): string {
  if (status === "failed") return "#dc2626";
  if (status === "done") return "#059669";
  if (status === "stopped") return "#94a3b8";
  if (status === "need_approval") return "#ea580c";
  return accent;
}
