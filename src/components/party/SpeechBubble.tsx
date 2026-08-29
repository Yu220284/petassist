"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SpeechBubbleProps = {
  text: string | null;
  placement?: "above" | "below";
  className?: string;
};

export function SpeechBubble({
  text,
  placement = "above",
  className,
}: SpeechBubbleProps) {
  const below = placement === "below";
  return (
    <AnimatePresence>
      {text ? (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: below ? -6 : 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: below ? 4 : -4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className={cn(
            "absolute left-1/2 z-20 max-w-[9rem] -translate-x-1/2 rounded-2xl bg-white px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-[#302c55] shadow-md",
            below ? "top-full mt-1" : "-top-10",
            className
          )}
        >
          {text}
          <span
            className={cn(
              "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white",
              below ? "-top-1" : "-bottom-1"
            )}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
