"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { TalkPrompt } from "@/lib/talk";
import { useI18n } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type TalkPanelProps = {
  prompt: TalkPrompt;
  name: string;
  onChoice: (choiceId: string) => void;
  onSend: (text: string) => void;
  className?: string;
};

export function TalkPanel({
  prompt,
  name,
  onChoice,
  onSend,
  className,
}: TalkPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const buttonsOnly = prompt.mode === "choice";
  const canChat = prompt.mode === "alert" || prompt.mode === "chat";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "pet-no-drag w-[220px] rounded-2xl bg-white p-2.5 text-[#302c55]",
        className
      )}
    >
      <p className="text-[10px] font-semibold text-slate-500">{name}</p>
      <p className="mt-0.5 text-[12px] font-medium leading-snug">{prompt.text}</p>
      {prompt.detail ? (
        <p className="mt-1 max-h-16 overflow-auto rounded-lg bg-slate-50 p-1.5 font-mono text-[10px] leading-snug">
          {prompt.detail}
        </p>
      ) : null}
      {buttonsOnly && prompt.choices?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {prompt.choices.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={c.id === "deny" || c.id === "cancel" ? "outline" : "default"}
              className="h-8 px-2 text-xs"
              onClick={() => onChoice(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      ) : null}
      {canChat ? (
        <form className="mt-2 flex gap-1" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.talk.instruct}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] outline-none focus:border-slate-400"
          />
          <Button type="submit" size="sm" className="h-8 px-2 text-xs">
            {t.talk.send}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
