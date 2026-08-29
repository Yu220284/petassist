"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PartyBar } from "@/components/party/PartyBar";
import { TalkPanel } from "@/components/party/TalkPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { useDesk } from "@/lib/hooks/use-desk";
import {
  publishDeskLooks,
  publishDeskSnapshot,
  publishDeskStatus,
  publishDeskTalk,
  publishDeskTalkOpen,
  publishDeskGrants,
  subscribeDesk,
} from "@/lib/desk-channel";
import { coatsFor } from "@/data/looks";
import { loadLooks, saveLooks, type LooksMap } from "@/lib/looks-store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/locale";
import type { TalkPrompt } from "@/lib/talk";
import {
  fetchHarnessStatus,
  resetAgentSessions,
  streamAgentTurn,
  type HarnessStatus,
  type TurnOutcome,
} from "@/lib/agent/client";
import { GrantPicker } from "@/components/party/GrantPicker";
import { CapabilityList } from "@/components/party/CapabilityList";
import { grantsFor, loadGrants, saveGrants, type GrantsMap } from "@/lib/grants-store";
import { configFor, loadConfigs, saveConfigs, type ConfigMap } from "@/lib/pet-config-store";
import { parsePetConfig } from "@/lib/pet-config";
import { DEFAULT_GRANTS, type PetGrants } from "@/lib/grants";
import {
  INITIAL_PARTY,
  isLiveAgent,
  pickBubble,
  type PartyMember,
  type PartyStatus,
} from "@/data/party";

type LogLine = { t: string; text: string };

function stamp(locale: string) {
  return new Date().toLocaleTimeString(locale === "ja" ? "ja-JP" : "en-GB", {
    hour12: false,
  });
}

export function DemoConsole() {
  const { locale, t } = useI18n();
  const [party, setParty] = useState<PartyMember[]>(INITIAL_PARTY);
  const [selectedId, setSelectedId] = useState<string | null>("dog");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [pendingPost, setPendingPost] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<TalkPrompt | null>(null);
  const [running, setRunning] = useState(false);
  const [harness, setHarness] = useState<HarnessStatus | null>(null);
  const [grantsMap, setGrantsMap] = useState<GrantsMap>({});
  const [configMap, setConfigMap] = useState<ConfigMap>({});
  const desk = useDesk();
  const partyRef = useRef(party);
  const promptRef = useRef(prompt);
  const pendingRef = useRef(pendingPost);
  const sessionsRef = useRef<Record<string, string>>({});
  const grantsMapRef = useRef(grantsMap);
  grantsMapRef.current = grantsMap;
  const configMapRef = useRef(configMap);
  configMapRef.current = configMap;
  const localeRef = useRef(locale);
  const tRef = useRef(t);
  partyRef.current = party;
  promptRef.current = prompt;
  pendingRef.current = pendingPost;
  localeRef.current = locale;
  tRef.current = t;

  useEffect(() => {
    const looks = loadLooks();
    if (!Object.keys(looks).length) return;
    setParty((prev) =>
      prev.map((p) => {
        const look = looks[p.id];
        return look
          ? { ...p, icon: look.icon || p.icon, accent: look.accent || p.accent }
          : p;
      })
    );
  }, []);

  useEffect(() => {
    setGrantsMap(loadGrants());
    setConfigMap(loadConfigs());
  }, []);

  useEffect(() => {
    setLogs([{ t: stamp(locale), text: t.log.ready }]);
  }, [locale, t.log.ready]);

  useEffect(() => {
    void fetchHarnessStatus().then(setHarness);
  }, []);

  const petName = (id: string) =>
    tRef.current.pets[id]?.name ??
    partyRef.current.find((p) => p.id === id)?.nameJa ??
    id;

  const allowChoices = () => [
    { id: "allow", label: tRef.current.talk.allow },
    { id: "deny", label: tRef.current.talk.deny },
  ];

  const pushLog = (text: string) =>
    setLogs((prev) => [{ t: stamp(localeRef.current), text }, ...prev].slice(0, 40));

  const pushTalk = (next: TalkPrompt | null) => {
    setPrompt(next);
    publishDeskTalk(next);
  };

  const setStatus = (id: string, status: PartyStatus) => {
    setParty((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        let progress = p.progress;
        if (status === "stopped") progress = 0;
        if (status === "need_approval") progress = Math.max(p.progress, 88);
        if (status === "working" && p.progress < 8) progress = 8;
        publishDeskStatus(id, status, progress);
        return { ...p, status, progress };
      });
      return next;
    });
  };

  const setProgress = (id: string, progress: number) => {
    setParty((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        publishDeskStatus(id, p.status, progress);
        return { ...p, progress };
      })
    );
  };

  const setLook = (id: string, patch: { icon?: string; accent?: string }) => {
    setParty((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const pet = next.find((p) => p.id === id);
      if (pet) {
        publishDeskLooks(id, pet.icon, pet.accent);
        const stored: LooksMap = {};
        for (const m of next) stored[m.id] = { icon: m.icon, accent: m.accent };
        saveLooks(stored);
      }
      return next;
    });
  };

  const applyOutcome = (petId: string, out: TurnOutcome) => {
    if (out.sessionId) sessionsRef.current[petId] = out.sessionId;
    if (out.runtime) {
      setHarness((prev) =>
        prev ? { ...prev, runtime: out.runtime ?? prev.runtime } : prev
      );
    }
    if (out.error) {
      setStatus(petId, "failed");
      pushTalk({ petId, mode: "alert", text: out.error });
      pushLog(tRef.current.log.error(out.error));
      return false;
    }
    if (out.approval) {
      setPendingPost(out.approval.detail);
      setStatus(petId, "need_approval");
      setProgress(petId, 88);
      pushTalk({
        petId,
        mode: "choice",
        text: out.approval.text,
        detail: out.approval.detail,
        choices: allowChoices(),
      });
      return true;
    }
    setProgress(petId, 100);
    setStatus(petId, "idle");
    if (out.text) {
      pushTalk({ petId, mode: "alert", text: out.text });
      pushLog(`${petName(petId)}: ${out.text}`);
    }
    return true;
  };

  const runPet = async (
    petId: string,
    input: { message?: string; approval?: "allow" | "deny" },
    grantsOverride?: PetGrants,
    requireHarness = false
  ): Promise<TurnOutcome> => {
    setSelectedId(petId);
    setStatus(petId, "working");
    const out = await streamAgentTurn(
      {
        petId,
        locale: localeRef.current,
        sessionId: sessionsRef.current[petId],
        message: input.message,
        approval: input.approval,
        grants:
          grantsOverride ?? grantsFor(grantsMapRef.current, petId),
        config: requireHarness
          ? { ...configFor(configMapRef.current, petId), model: "auto" }
          : configFor(configMapRef.current, petId),
        requireHarness,
      },
      (event, partial) => {
        if (partial.progress) setProgress(petId, partial.progress);
        if (partial.sessionId) sessionsRef.current[petId] = partial.sessionId;
        if (event.type === "harness") {
          pushLog(tRef.current.log.harness(event.kind, event.detail));
        }
      }
    );
    applyOutcome(petId, out);
    return out;
  };

  const handleReply = (
    petId: string,
    kind: "choice" | "message",
    choiceId?: string,
    text?: string
  ) => {
    void (async () => {
      if (kind === "choice") {
        const out = await runPet(petId, {
          approval: choiceId === "allow" ? "allow" : "deny",
        });
        if (out.error) return;
        if (choiceId === "allow") {
          pushLog(
            tRef.current.log.allow(petName(petId), pendingRef.current ?? "")
          );
        } else {
          pushLog(tRef.current.log.deny(petName(petId)));
        }
        setPendingPost(null);
        return;
      }
      if (!text) return;
      pushLog(tRef.current.log.instructed(petName(petId), text));
      await runPet(petId, { message: text });
    })();
  };

  const handleReplyRef = useRef(handleReply);
  handleReplyRef.current = handleReply;
  const pushTalkRef = useRef(pushTalk);
  pushTalkRef.current = pushTalk;

  useEffect(() => {
    return subscribeDesk((event) => {
      if (event.type === "hello") {
        publishDeskSnapshot(
          partyRef.current.map((p) => ({
            id: p.id,
            status: p.status,
            progress: p.progress,
            icon: p.icon,
            accent: p.accent,
          })),
          promptRef.current
        );
        return;
      }
      if (event.type === "config") {
        setConfigMap((prev) => {
          const map = { ...prev, [event.id]: parsePetConfig(event.config) };
          saveConfigs(map);
          return map;
        });
        return;
      }
      if (event.type === "grants") {
        setGrantsMap((prev) => {
          const map = { ...prev, [event.id]: event.grants };
          saveGrants(map);
          return map;
        });
        return;
      }
      if (event.type === "talk-open") {
        const current = promptRef.current;
        if (current?.petId === event.petId && current.mode === "choice") return;
        const pet = partyRef.current.find((p) => p.id === event.petId);
        if (!pet || pet.status === "stopped") return;
        setSelectedId(event.petId);
        const keepAlert =
          current?.petId === event.petId && current.mode === "alert";
        pushTalkRef.current({
          petId: event.petId,
          mode: keepAlert ? "alert" : "chat",
          text: keepAlert ? current.text : tRef.current.talk.ask,
          detail: keepAlert ? current.detail : undefined,
        });
        return;
      }
      if (event.type === "talk-reply") {
        handleReplyRef.current(
          event.petId,
          event.kind,
          event.choiceId,
          event.text
        );
      }
    });
  }, []);

  const selected = useMemo(
    () => party.find((p) => p.id === selectedId) ?? null,
    [party, selectedId]
  );

  const speakAlert = (id: string, text: string) => {
    setSelectedId(id);
    setStatus(id, "failed");
    pushTalk({ petId: id, mode: "alert", text });
  };

  const resetLive = () => {
    setParty((prev) =>
      prev.map((p) =>
        isLiveAgent(p.id)
          ? { ...p, status: "idle" as const, progress: 0 }
          : p
      )
    );
    for (const p of partyRef.current) {
      if (isLiveAgent(p.id)) publishDeskStatus(p.id, "idle", 0);
    }
    pushTalk(null);
    sessionsRef.current = {};
  };

  const runJob = async () => {
    if (running) return;
    setRunning(true);
    const copy = tRef.current;
    const lang = localeRef.current;
    try {
      resetLive();
      await resetAgentSessions();
      pushLog(copy.log.incoming(copy.job.body));

      const jobText =
        lang === "ja"
          ? `未知の送信者（${copy.job.sender}）から:\n${copy.job.body}\nTrueForge のサンドボックスで隔離して調べてください。調べ物はサブエージェントに渡し、親には結論だけ戻してください。外には出さないでください。Finder はこの仕事では使いません。`
          : `Unknown sender (${copy.job.sender}):\n${copy.job.body}\nInspect inside the TrueForge sandbox. Spawn subagents for lookups; return only the conclusion. Do not send. Do not use Finder for this job.`;

      pushLog(copy.log.catStart);
      const catOut = await runPet("cat", { message: jobText }, DEFAULT_GRANTS, true);
      if (catOut.error) return;

      const bunnyText =
        lang === "ja"
          ? `ねこの調査（結論だけ）:\n${catOut.text}\n丁寧な拒否の下書きを書いてください。送らないでください。write ツールは使わないでください。`
          : `Cat research (conclusion only):\n${catOut.text}\nWrite a polite refusal draft. Do not send. No write tools.`;

      pushLog(copy.log.bunnyStart);
      const bunnyOut = await runPet("bunny", { message: bunnyText }, DEFAULT_GRANTS, true);
      if (bunnyOut.error) return;

      const dogText =
        lang === "ja"
          ? `うさぎの下書き:\n${bunnyOut.text}\nSlack に出す準備をしてください。write MCP があればそれを呼び、TrueForge のツール承認で止まってください。なければ ask_user_question で止まってください。Allow まで投稿しないでください。`
          : `Bunny draft:\n${bunnyOut.text}\nPrepare to post to Slack. If a write MCP is attached, call it and pause on TrueForge tool approval. Otherwise pause with ask_user_question. Do not post until Allow.`;

      pushLog(copy.log.dogStart);
      await runPet("dog", { message: dogText }, DEFAULT_GRANTS, true);
    } catch (err) {
      pushLog(
        copy.log.error(err instanceof Error ? err.message : "Agent failed")
      );
    } finally {
      setRunning(false);
      void fetchHarnessStatus().then(setHarness);
    }
  };

  const onStatusClick = (id: string, status: PartyStatus) => {
    if (status === "failed") {
      const pet = partyRef.current.find((p) => p.id === id);
      if (!pet) return;
      const copy = tRef.current.pets[id]?.bubbles.failed;
      speakAlert(id, pickBubble({ ...pet, status: "failed" }, copy));
      pushLog(tRef.current.log.failAlert(petName(id)));
      return;
    }
    setStatus(id, status);
    if (status === "idle" || status === "stopped") pushTalk(null);
  };

  const harnessLabel =
    harness == null
      ? t.harness.checking
      : harness.runtime === "trueforge"
        ? t.harness.trueforge
        : harness.runtime === "openai"
          ? t.harness.openai
          : t.harness.offline;

  const setPetGrants = (id: string, next: PetGrants) => {
    setGrantsMap((prev) => {
      const map = { ...prev, [id]: next };
      saveGrants(map);
      return map;
    });
    publishDeskGrants(id, next);
  };

  const selectedCopy = selected ? t.pets[selected.id] : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[hsl(var(--primary))]">
            {t.brand.kicker}
          </p>
          <h1 className="text-lg font-bold text-[#302c55]">{t.brand.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Badge variant={harness?.runtime ? "secondary" : "outline"}>
            {harnessLabel}
          </Badge>
        </div>
      </header>

      <section className="rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
        <h2 className="mb-1 text-sm font-bold text-[#302c55]">{t.job.heading}</h2>
        <p className="mb-3 text-xs text-slate-500">{t.job.hint}</p>
        {harness?.runtime === "trueforge" ? (
          <p className="mb-3 text-[11px] text-slate-500">
            {locale === "ja"
              ? `MCP 検索: ${harness.mcp?.search ?? "未設定"}　投稿: ${harness.mcp?.write ?? "未設定"}`
              : `MCP search: ${harness.mcp?.search ?? "none"} · write: ${harness.mcp?.write ?? "none"}`}
          </p>
        ) : null}
        <div className="mb-3 rounded-xl border border-slate-100 bg-[#f7f8fb] p-3">
          <p className="text-[11px] font-semibold text-slate-500">
            {t.job.from} · {t.job.sender}
          </p>
          <p className="mt-1 text-sm text-[#302c55]">{t.job.body}</p>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() => void runJob()}
            disabled={running || harness?.runtime !== "trueforge"}
          >
            {running ? t.job.running : t.job.run}
          </Button>
          {desk.available ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => void desk.pinAllTop()}
            >
              {t.job.pinAll}
            </Button>
          ) : null}
        </div>
        {prompt ? (
          <div className="mb-3">
            <TalkPanel
              className="w-full max-w-none"
              prompt={prompt}
              name={petName(prompt.petId)}
              onChoice={(choiceId) =>
                handleReply(prompt.petId, "choice", choiceId)
              }
              onSend={(text) =>
                handleReply(prompt.petId, "message", undefined, text)
              }
            />
          </div>
        ) : null}
        <div className="max-h-48 space-y-1 overflow-auto rounded-xl bg-[#f7f8fb] p-3 font-mono text-xs text-[#302c55]">
          {logs.map((l, i) => (
            <p key={`${l.t}-${i}`}>
              <span className="text-slate-400">{l.t}</span> {l.text}
            </p>
          ))}
        </div>
      </section>

      {selected && (
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
          <h2 className="mb-2 text-sm font-bold text-[#302c55]">
            {t.selected.heading(
              selectedCopy?.name ?? selected.nameJa,
              selectedCopy?.role ?? selected.role
            )}
          </h2>
          <p className="mb-2 text-sm">
            {t.selected.license}{" "}
            <Badge>
              {selected.tier} {t.tier[selected.tier]}
            </Badge>{" "}
            <Badge variant="secondary">{t.status[selected.status]}</Badge>
          </p>
          <CapabilityList
            className="mb-3 rounded-xl bg-[#f7f8fb] p-3"
            petId={selected.id}
            grants={grantsFor(grantsMap, selected.id)}
            config={configFor(configMap, selected.id)}
          />
          <div className="mb-2 flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={selected.status === "idle" ? "default" : "outline"}
              onClick={() => onStatusClick(selected.id, "idle")}
            >
              {t.selected.live}
            </Button>
            <Button
              size="sm"
              variant={selected.status === "stopped" ? "default" : "outline"}
              onClick={() => onStatusClick(selected.id, "stopped")}
            >
              {t.selected.stop}
            </Button>
            <Button
              size="sm"
              variant={selected.status === "failed" ? "default" : "outline"}
              onClick={() => onStatusClick(selected.id, "failed")}
            >
              {t.selected.fail}
            </Button>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-slate-500">
            {t.selected.coat}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {coatsFor(selected.id).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setLook(selected.id, { icon: src })}
                className={cn(
                  "rounded-lg p-0.5",
                  selected.icon === src
                    ? "ring-2 ring-[hsl(var(--ring))]"
                    : "opacity-70"
                )}
              >
                <img
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            {t.selected.gauge}
            <input
              type="color"
              value={selected.accent}
              onChange={(e) => setLook(selected.id, { accent: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-white"
            />
          </label>
          <GrantPicker
            grants={grantsFor(grantsMap, selected.id)}
            deskAvailable={desk.available}
            onChange={(next) => setPetGrants(selected.id, next)}
          />
        </section>
      )}

      <div className="sticky bottom-3 z-30 mt-auto overflow-visible">
        <PartyBar
          party={party}
          selectedId={selectedId}
          pinnedIds={desk.pinned}
          hiddenIds={desk.hidden}
          tearOff={desk.available}
          onSelect={setSelectedId}
          onChat={publishDeskTalkOpen}
        />
        <p className="mt-2 text-center text-[11px] text-slate-500">{t.footer}</p>
      </div>
    </div>
  );
}
