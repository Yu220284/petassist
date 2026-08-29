"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PartySlot } from "@/components/party/PartySlot";
import { TalkPanel } from "@/components/party/TalkPanel";
import { INITIAL_PARTY, type PartyMember } from "@/data/party";
import {
  publishDeskHello,
  publishDeskTalkOpen,
  publishDeskTalkReply,
  subscribeDesk,
} from "@/lib/desk-channel";
import { useI18n } from "@/lib/i18n/locale";
import { talkWindowMode, type TalkPrompt } from "@/lib/talk";

function StickyPet() {
  const { t } = useI18n();
  const params = useSearchParams();
  const id = params.get("id");
  const seed = useMemo(
    () => INITIAL_PARTY.find((p) => p.id === id) ?? INITIAL_PARTY[0]!,
    [id]
  );
  const [member, setMember] = useState<PartyMember>(seed);
  const [prompt, setPrompt] = useState<TalkPrompt | null>(null);

  useEffect(() => {
    setMember(seed);
  }, [seed]);

  useEffect(() => {
    const mode = talkWindowMode(prompt?.petId === seed.id ? prompt : null);
    void window.petassist?.resizeSticky(seed.id, mode);
  }, [prompt, seed.id]);

  useEffect(() => {
    const unsub = subscribeDesk((event) => {
      if (event.type === "status" && event.id === seed.id) {
        setMember((prev) => ({
          ...prev,
          status: event.status,
          progress: event.progress,
        }));
        return;
      }
      if (event.type === "looks" && event.id === seed.id) {
        setMember((prev) => ({
          ...prev,
          icon: event.icon,
          accent: event.accent,
        }));
        return;
      }
      if (event.type === "snapshot") {
        const row = event.members.find((m) => m.id === seed.id);
        if (row) {
          setMember((prev) => ({
            ...prev,
            status: row.status,
            progress: row.progress,
            icon: row.icon,
            accent: row.accent,
          }));
        }
        setPrompt(event.prompt?.petId === seed.id ? event.prompt : null);
        return;
      }
      if (event.type === "talk") {
        setPrompt(event.prompt?.petId === seed.id ? event.prompt : null);
      }
    });
    publishDeskHello();
    const retry = setTimeout(() => publishDeskHello(), 400);
    return () => {
      clearTimeout(retry);
      unsub();
    };
  }, [seed.id]);

  const mine = prompt?.petId === seed.id ? prompt : null;
  const name = t.pets[member.id]?.name ?? member.nameJa;

  return (
    <main className="pet-sticky flex min-h-screen flex-col items-center justify-start bg-transparent pt-1">
      <div className="pet-no-drag flex flex-col items-center">
        <PartySlot
          member={member}
          sticky
          compact
          suppressBubble={Boolean(mine)}
          onChat={() => {
            if (mine?.mode === "choice") return;
            publishDeskTalkOpen(seed.id);
          }}
        />
      </div>
      {mine ? (
        <div className="pet-no-drag mt-1">
          <TalkPanel
            prompt={mine}
            name={name}
            onChoice={(choiceId) =>
              publishDeskTalkReply({
                petId: seed.id,
                kind: "choice",
                choiceId,
              })
            }
            onSend={(text) =>
              publishDeskTalkReply({
                petId: seed.id,
                kind: "message",
                text,
              })
            }
          />
        </div>
      ) : null}
    </main>
  );
}

export default function PetPage() {
  return (
    <Suspense>
      <StickyPet />
    </Suspense>
  );
}
