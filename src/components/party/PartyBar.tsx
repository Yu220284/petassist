"use client";

import { PartySlot } from "@/components/party/PartySlot";
import type { PartyMember } from "@/data/party";
import { cn } from "@/lib/utils";

type PartyBarProps = {
  party: PartyMember[];
  selectedId?: string | null;
  pinnedIds?: string[];
  tearOff?: boolean;
  onSelect?: (id: string) => void;
  onChat?: (id: string) => void;
  hiddenIds?: string[];
  transparent?: boolean;
  compact?: boolean;
  className?: string;
};

export function PartyBar({
  party,
  selectedId,
  pinnedIds,
  tearOff,
  onSelect,
  onChat,
  hiddenIds,
  transparent,
  compact,
  className,
}: PartyBarProps) {
  return (
    <div
      className={cn(
        "relative z-20 flex items-end justify-center gap-1 overflow-visible px-2 py-2",
        !transparent &&
          "rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-md",
        className
      )}
    >
      {party.map((m) => (
        <PartySlot
          key={m.id}
          member={m}
          selected={selectedId === m.id}
          compact={compact}
          pinned={pinnedIds?.includes(m.id)}
          hidden={hiddenIds?.includes(m.id)}
          tearOff={tearOff}
          onSelect={onSelect}
          onChat={onChat}
        />
      ))}
    </div>
  );
}
