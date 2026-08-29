"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { GatePanel } from "@/lib/pet-config";

type PetMenuProps = {
  petId: string;
  sticky?: boolean;
  stopped?: boolean;
  hidden?: boolean;
  pinned?: boolean;
  onTalk: () => void;
  onPanel: (panel: GatePanel) => void;
  onClose: () => void;
};

export function PetMenu({
  petId,
  sticky,
  stopped,
  hidden,
  pinned,
  onTalk,
  onPanel,
  onClose,
}: PetMenuProps) {
  const { t } = useI18n();
  const desk = typeof window !== "undefined" ? window.petassist : undefined;

  const run = (fn: () => void | Promise<unknown>) => {
    void fn();
    onClose();
  };

  return (
    <div
      className={cn(
        "pet-no-drag absolute left-1/2 z-30 w-[176px] -translate-x-1/2 rounded-2xl bg-white p-1.5 shadow-lg",
        sticky ? "top-full mt-1" : "bottom-full mb-1"
      )}
      onMouseDown={(e) => e.stopPropagation()}
      role="menu"
    >
      {!stopped ? (
        <MenuItem onClick={() => run(onTalk)}>{t.menu.talk}</MenuItem>
      ) : null}
      {desk ? (
        <MenuItem onClick={() => run(() => desk.showDock())}>
          {t.menu.openDock}
        </MenuItem>
      ) : null}
      <MenuItem onClick={() => run(() => onPanel("policy"))}>
        {t.menu.policy}
      </MenuItem>
      <MenuItem onClick={() => run(() => onPanel("grants"))}>
        {t.menu.grants}
      </MenuItem>
      <MenuItem onClick={() => run(() => onPanel("model"))}>
        {t.menu.model}
      </MenuItem>
      <MenuItem onClick={() => run(() => onPanel("tools"))}>
        {t.menu.tools}
      </MenuItem>
      <MenuItem onClick={() => run(() => onPanel("apps"))}>
        {t.menu.apps}
      </MenuItem>
      {desk && (sticky || pinned) ? (
        hidden ? (
          <MenuItem onClick={() => run(() => desk.showSticky(petId))}>
            {t.menu.showDesktop}
          </MenuItem>
        ) : (
          <MenuItem onClick={() => run(() => desk.hideSticky(petId))}>
            {t.menu.hide}
          </MenuItem>
        )
      ) : null}
      {sticky && desk ? (
        <MenuItem onClick={() => run(() => desk.unpin(petId))}>
          {t.menu.unpin}
        </MenuItem>
      ) : null}
      {!sticky && desk ? (
        <>
          <MenuItem onClick={() => run(() => desk.pin(petId))}>
            {t.menu.pin}
          </MenuItem>
          <MenuItem onClick={() => run(() => desk.pinAllTop())}>
            {t.menu.pinAll}
          </MenuItem>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full rounded-xl px-2.5 py-1.5 text-left text-[11px] font-medium text-[#302c55] hover:bg-slate-50"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
