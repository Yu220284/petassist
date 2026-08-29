"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
} from "react";
import { motion, useAnimationControls } from "framer-motion";
import {
  STATUS_DOT,
  TIER_COLOR,
  pickBubble,
  type PartyMember,
} from "@/data/party";
import { FACE_FILES, spriteFor } from "@/data/looks";
import { HeadGauge } from "@/components/party/HeadGauge";
import { SpeechBubble } from "@/components/party/SpeechBubble";
import { PetMenu } from "@/components/party/PetMenu";
import { PetGateSheet } from "@/components/party/PetGateSheet";
import { useI18n } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { GatePanel } from "@/lib/pet-config";

const CLICK_WAIT_MS = 280;

type PartySlotProps = {
  member: PartyMember;
  selected?: boolean;
  compact?: boolean;
  pinned?: boolean;
  tearOff?: boolean;
  sticky?: boolean;
  hidden?: boolean;
  suppressBubble?: boolean;
  onSelect?: (id: string) => void;
  onChat?: (id: string) => void;
};

export function PartySlot({
  member,
  selected,
  compact,
  pinned,
  tearOff,
  sticky,
  hidden,
  suppressBubble,
  onSelect,
  onChat,
}: PartySlotProps) {
  const { locale, t } = useI18n();
  const pet = t.pets[member.id];
  const statusLabel = t.status[member.status];
  const controls = useAnimationControls();
  const [statusBubble, setStatusBubble] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<GatePanel | null>(null);
  const [lifting, setLifting] = useState(false);
  const drag = useRef({ x: 0, y: 0, active: false, moved: false });
  const clickTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const hadMenu = useRef(false);
  const floatDelay = (member.id.charCodeAt(0) % 5) * 0.35;
  const status = member.status;
  const isBusy = status === "working";
  const needsYou = status === "need_approval";
  const stopped = status === "stopped";
  const failed = status === "failed";
  const spriteSize = sticky ? 64 : compact ? 48 : 56;
  const hasFailedArt = Boolean(FACE_FILES[member.id]?.failed);
  const hasStoppedArt = Boolean(FACE_FILES[member.id]?.stopped);

  const clearClickTimer = () => {
    if (clickTimer.current != null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  };

  useEffect(() => () => clearClickTimer(), []);

  useEffect(() => {
    if (!statusBubble) return;
    if (failed || needsYou) return;
    const hide = setTimeout(() => setStatusBubble(null), 2200);
    return () => clearTimeout(hide);
  }, [statusBubble, failed, needsYou]);

  useEffect(() => {
    if (suppressBubble) {
      setStatusBubble(null);
      setMenuOpen(false);
      setPanel(null);
      return;
    }
    if (status === "idle" || status === "empty" || status === "stopped") return;
    setStatusBubble(pickBubble(member, pet?.bubbles[member.status]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- party object identity changes every tick
  }, [status, member.id, suppressBubble, locale]);

  useEffect(() => {
    if (!menuOpen && !panel) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setPanel(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setPanel(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, panel]);

  useEffect(() => {
    if (!sticky) return;
    if (suppressBubble) {
      hadMenu.current = false;
      return;
    }
    if (panel) {
      hadMenu.current = true;
      void window.petassist?.resizeSticky(member.id, "settings");
      return;
    }
    if (menuOpen) {
      hadMenu.current = true;
      void window.petassist?.resizeSticky(member.id, "menu");
      return;
    }
    if (!hadMenu.current) return;
    hadMenu.current = false;
    const wait = window.setTimeout(() => {
      void window.petassist?.resizeSticky(member.id, "compact");
    }, 400);
    return () => window.clearTimeout(wait);
  }, [menuOpen, panel, sticky, suppressBubble, member.id]);

  const chat = () => {
    setMenuOpen(false);
    setPanel(null);
    if (stopped) {
      onSelect?.(member.id);
      return;
    }
    onSelect?.(member.id);
    onChat?.(member.id);
    void hop();
  };

  const hop = async () => {
    await controls.start({
      y: [0, needsYou || failed ? -18 : -12, 0],
      transition: { duration: 0.4, times: [0, 0.45, 1], type: "tween" },
    });
  };

  const openMenu = () => {
    onSelect?.(member.id);
    setPanel(null);
    setMenuOpen(true);
    void hop();
  };

  const onPetClick = (e: ReactMouseEvent) => {
    if (drag.current.moved) return;
    if (e.detail >= 2) {
      clearClickTimer();
      openMenu();
      return;
    }
    clearClickTimer();
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      chat();
    }, CLICK_WAIT_MS);
  };

  const onPetDoubleClick = (e: ReactMouseEvent) => {
    e.preventDefault();
    clearClickTimer();
    openMenu();
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!tearOff || !window.petassist || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, active: true, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const dist = Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y);
    if (dist > 8 && !drag.current.moved) {
      drag.current.moved = true;
      setLifting(true);
      clearClickTimer();
    }
  };

  const onPointerUp = async (e: PointerEvent<HTMLButtonElement>) => {
    if (!tearOff) return;
    if (!drag.current.active) return;
    const moved = drag.current.moved;
    drag.current.active = false;
    setLifting(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (moved) {
      clearClickTimer();
      await window.petassist?.pin(member.id);
    }
  };

  const hoverEllipsis =
    hovered &&
    !menuOpen &&
    !panel &&
    !suppressBubble &&
    !statusBubble &&
    !stopped &&
    !needsYou &&
    !isBusy &&
    !failed;

  const bubbleText =
    suppressBubble || menuOpen || panel
      ? null
      : statusBubble || (hoverEllipsis ? t.talk.ellipsis : null);

  const bob = stopped
    ? { y: 0 }
    : failed
      ? {
          x: [0, -3, 3, -2, 2, 0],
          y: [0, -2, 0],
          transition: { duration: 0.55, ease: "easeInOut" as const },
        }
      : needsYou
        ? {
            y: [0, -6, 0],
            transition: { repeat: Infinity, duration: 0.7 },
          }
        : {
            y: [0, isBusy ? -6 : -4, 0],
            transition: {
              repeat: Infinity,
              duration: isBusy ? 1.15 : 2.6 + floatDelay,
              ease: "easeInOut" as const,
              delay: floatDelay,
            },
          };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex flex-col items-center",
        sticky && "min-w-[88px] pet-no-drag",
        pinned && "opacity-40",
        lifting && "opacity-30 scale-90"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {menuOpen ? (
        <PetMenu
          petId={member.id}
          sticky={sticky}
          stopped={stopped}
          hidden={hidden}
          pinned={pinned}
          onTalk={chat}
          onPanel={(next) => {
            setMenuOpen(false);
            setPanel(next);
          }}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
      {panel ? (
        <PetGateSheet
          petId={member.id}
          panel={panel}
          sticky={sticky}
          onClose={() => setPanel(null)}
        />
      ) : null}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current.active = false;
          setLifting(false);
        }}
        onClick={onPetClick}
        onDoubleClick={onPetDoubleClick}
        className={cn(
          "relative flex flex-col items-center gap-1 rounded-2xl p-1 outline-none transition",
          sticky ? "pet-no-drag" : undefined,
          hovered && !menuOpen && "brightness-[1.03]",
          selected && "ring-2 ring-pink-200 ring-offset-2",
          compact ? "min-w-[64px]" : "min-w-[72px]"
        )}
        aria-label={`${pet?.name ?? member.nameJa} ${t.tier[member.tier]} ${statusLabel}`}
      >
        <SpeechBubble
          text={bubbleText}
          placement={sticky ? "below" : "above"}
          className={hoverEllipsis ? "tracking-[0.35em] pl-2" : undefined}
        />
        <div className={sticky ? "pet-sticky" : undefined}>
          <HeadGauge
            progress={member.progress}
            status={status}
            accent={member.accent}
            wide={sticky}
          />
        </div>
        <motion.div animate={controls} className="relative pet-no-drag">
          {isBusy ? (
            <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/40 animate-ping" />
          ) : null}
          <motion.img
            src={spriteFor(member)}
            alt=""
            width={spriteSize}
            height={spriteSize}
            className={cn(
              "relative z-[1] select-none object-contain drop-shadow-md",
              stopped && !hasStoppedArt && "grayscale brightness-90 opacity-70",
              failed && !hasFailedArt && "contrast-125",
              needsYou && "drop-shadow-[0_0_8px_rgba(232,93,76,0.7)]"
            )}
            animate={bob}
            draggable={false}
          />
          <span
            className={cn(
              "absolute -right-0.5 bottom-1 z-[2] h-2.5 w-2.5 rounded-full ring-2 ring-white",
              STATUS_DOT[status],
              (isBusy || needsYou || failed) && "animate-pulse"
            )}
            title={statusLabel}
          />
        </motion.div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold text-white pet-no-drag",
            stopped ? "bg-slate-400" : TIER_COLOR[member.tier],
            needsYou && "animate-pulse"
          )}
        >
          {member.tier}
        </span>
        {sticky ? (
          <span
            className={cn(
              "text-[10px] font-medium pet-no-drag",
              failed ? "text-red-600" : stopped ? "text-slate-400" : "text-slate-700"
            )}
          >
            {statusLabel}
          </span>
        ) : !compact ? (
          <span className="text-[10px] font-medium text-slate-700">
            {pet?.name ?? member.nameJa}
          </span>
        ) : null}
      </button>
    </div>
  );
}
