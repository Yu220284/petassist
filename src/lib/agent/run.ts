import { instructionsFor, isLiveAgentId, trueForgeAgentSpec } from "./specs";
import { MESSAGES } from "@/lib/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n/types";
import { needsLocalRuntime, parseGrants } from "@/lib/grants";
import { parsePetConfig, usesLlmGateway } from "@/lib/pet-config";
import { isDeskTool } from "./sandbox";
import { listMcpCatalog } from "./mcp";
import {
  createTrueForgeSession,
  pickTrueForgeModel,
  probeTrueForge,
  runTrueForgeTurn,
} from "./trueforge";
import { routeForModel } from "./gateway";
import { probeOpenAi, runOpenAiTurn, resumeOpenAiApproval } from "./openai";
import { getSession, newSessionId, putSession, resetPetSessions } from "./store";
import type {
  AgentRuntime,
  AgentSession,
  AgentStreamEvent,
  OpenAiMessage,
  PendingAction,
} from "./types";

export type TurnRequest = {
  petId: string;
  locale: Locale;
  sessionId?: string;
  message?: string;
  approval?: "allow" | "deny";
  grants?: unknown;
  config?: unknown;
  requireHarness?: boolean;
};

type Emit = (event: AgentStreamEvent) => void;

export async function harnessStatus(): Promise<{
  runtime: AgentRuntime | null;
  trueforge: Awaited<ReturnType<typeof probeTrueForge>>;
  openai: ReturnType<typeof probeOpenAi>;
  mcp: Awaited<ReturnType<typeof listMcpCatalog>>;
}> {
  const tf = await probeTrueForge();
  const oa = probeOpenAi();
  const mcp = tf.ok
    ? await listMcpCatalog()
    : { names: [], search: null, write: null };
  const runtime: AgentRuntime | null = tf.ok
    ? "trueforge"
    : oa.ok
      ? "openai"
      : null;
  return {
    runtime,
    trueforge: tf,
    openai: oa,
    mcp,
  };
}

export async function runAgentTurn(req: TurnRequest, emit: Emit) {
  if (!isLiveAgentId(req.petId)) {
    emit({ type: "error", message: MESSAGES[req.locale].errors.unknownPet });
    return;
  }
  const locale = isLocale(req.locale) ? req.locale : "ja";
  const grants = parseGrants(req.grants);
  const config = parsePetConfig(req.config);
  const session = req.sessionId ? getSession(req.sessionId) : undefined;
  if (session) {
    session.grants = grants;
    session.config = config;
  }
  const status = await harnessStatus();

  if (req.approval && !session?.pending) {
    emit({
      type: "error",
      message:
        locale === "ja"
          ? "承認待ちの操作がありません"
          : "Nothing is waiting for approval",
    });
    return;
  }

  if (session?.pending && req.approval) {
    emit({ type: "meta", sessionId: session.id, runtime: session.runtime });
    emit({ type: "progress", progress: 36 });
    try {
      if (session.runtime === "trueforge" && session.trueforgeSessionId) {
        const input = approvalInput(session, req.approval, locale);
        session.pending = undefined;
        putSession(session);
        const result = await runTrueForgeTurn(
          session.trueforgeSessionId,
          input,
          (event) => {
            emit({ type: "progress", progress: event.progress });
            if (event.text) emit({ type: "text", text: event.text });
            if (event.harness) emit({ type: "harness", ...event.harness });
          }
        );
        finishTurn(session, result.text, result.pending, emit, result.error);
        return;
      }
      if (session.runtime === "openai") {
        const result = await resumeOpenAiApproval(
          session,
          req.approval,
          (progress, text) => {
            emit({ type: "progress", progress });
            if (text) emit({ type: "text", text });
          }
        );
        session.openaiMessages = result.messages;
        session.pending = result.pending;
        putSession(session);
        finishTurn(session, result.text, result.pending, emit);
        return;
      }
    } catch (err) {
      emit({
        type: "error",
        message: err instanceof Error ? err.message : "Agent failed",
      });
    }
    return;
  }

  const message = req.message?.trim();
  if (!message) {
    emit({
      type: "error",
      message: locale === "ja" ? "指示が空です" : "Empty instruction",
    });
    return;
  }

  const local = needsLocalRuntime(grants);
  const gateway = usesLlmGateway(config);
  if (req.requireHarness) {
    if (!status.trueforge.ok) {
      emit({ type: "error", message: MESSAGES[locale].errors.needsHarness });
      return;
    }
  } else if (gateway) {
    const routed = routeForModel(config.model);
    if (!("auto" in routed) && !routed.apiKey) {
      emit({
        type: "error",
        message:
          routed.provider === "gemini"
            ? locale === "ja"
              ? "GEMINI_API_KEY がありません"
              : "GEMINI_API_KEY missing"
            : MESSAGES[locale].errors.needsLocal,
      });
      return;
    }
  } else if (local && !status.openai.ok) {
    emit({ type: "error", message: MESSAGES[locale].errors.needsLocal });
    return;
  }

  let runtime: AgentRuntime | null = session?.runtime ?? status.runtime;
  if (req.requireHarness) runtime = "trueforge";
  else if (local || gateway) runtime = "openai";
  if (runtime !== "trueforge" && runtime !== "openai") {
    emit({ type: "error", message: MESSAGES[locale].errors.noRuntime });
    return;
  }

  const active: AgentSession = session ?? {
    id: newSessionId(),
    petId: req.petId,
    locale,
    runtime,
  };
  active.locale = locale;
  active.runtime = runtime;
  active.grants = grants;
  active.config = config;
  putSession(active);
  emit({ type: "meta", sessionId: active.id, runtime });
  emit({ type: "progress", progress: 10 });

  try {
    if (runtime === "trueforge") {
      if (!active.trueforgeSessionId) {
        const model = status.trueforge.model ?? (await pickTrueForgeModel());
        if (!model) throw new Error("TrueForge has no chat model");
        const mcp = status.mcp ?? (await listMcpCatalog());
        if (req.petId === "cat" && mcp.search) {
          emit({ type: "harness", kind: "mcp", detail: mcp.search });
        }
        if (req.petId === "dog" && mcp.write) {
          emit({ type: "harness", kind: "mcp", detail: mcp.write });
        }
        active.trueforgeSessionId = await createTrueForgeSession(
          trueForgeAgentSpec({
            petId: req.petId,
            model,
            locale,
            grants,
            config,
            mcp,
          })
        );
        putSession(active);
        emit({ type: "progress", progress: 22 });
      }
      const result = await runTrueForgeTurn(
        active.trueforgeSessionId,
        [{ type: "user.message", content: message }],
        (event) => {
          emit({ type: "progress", progress: event.progress });
          if (event.text) emit({ type: "text", text: event.text });
          if (event.harness) emit({ type: "harness", ...event.harness });
        }
      );
      finishTurn(active, result.text, result.pending, emit, result.error);
      return;
    }

    const system: OpenAiMessage = {
      role: "system",
      content: instructionsFor(req.petId, locale, grants, "openai", config),
    };
    const history = active.openaiMessages?.length
      ? active.openaiMessages
      : [system];
    if (history[0]?.role === "system") history[0] = system;
    else history.unshift(system);
    history.push({ role: "user", content: message });
    const result = await runOpenAiTurn({
      petId: req.petId,
      locale,
      messages: history,
      grants,
      config,
      onProgress: (progress, text) => {
        emit({ type: "progress", progress });
        if (text) emit({ type: "text", text });
      },
    });
    active.openaiMessages = result.messages;
    active.pending = result.pending;
    putSession(active);
    finishTurn(active, result.text, result.pending, emit);
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : "Agent failed",
    });
  }
}

function approvalInput(
  session: AgentSession,
  approval: "allow" | "deny",
  locale: Locale
) {
  const pending = session.pending!;
  if (pending.kind === "ask_user") {
    return [
      {
        type: "user.tool_response",
        thread_id: pending.threadId,
        tool_call_id: pending.toolCallId,
        content:
          approval === "allow"
            ? locale === "ja"
              ? "みとめる"
              : "Allow"
            : locale === "ja"
              ? "やめる"
              : "Deny",
      },
    ];
  }
  return [
    {
      type: "user.tool_approval",
      thread_id: pending.threadId,
      tool_call_id: pending.toolCallId,
      approval:
        approval === "allow"
          ? { status: "allow" }
          : {
              status: "deny",
              reason: locale === "ja" ? "トレーナーが拒否" : "Trainer denied",
            },
    },
  ];
}

function finishTurn(
  session: AgentSession,
  text: string,
  pending: PendingAction | undefined,
  emit: Emit,
  error?: string
) {
  if (error) {
    emit({ type: "error", message: error });
    return;
  }
  session.pending = pending;
  putSession(session);
  const say = text || (session.locale === "ja" ? "わかった" : "Got it.");
  emit({ type: "text", text: say });
  emit({ type: "progress", progress: pending ? 88 : 100 });
  if (pending) {
    emit({
      type: "approval",
      sessionId: session.id,
      toolName: pending.toolName,
      detail: prettyArgs(pending.argsText),
      text: approvalLine(session, pending),
    });
    return;
  }
  emit({ type: "done", sessionId: session.id, text: say });
}

function prettyArgs(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const rec = parsed as Record<string, unknown>;
      if (typeof rec.text === "string") return rec.text;
      if (typeof rec.draft === "string") return rec.draft;
      if (typeof rec.question === "string") return rec.question;
      if (typeof rec.command === "string") {
        return rec.cwd ? `${rec.command}  (${rec.cwd})` : rec.command;
      }
      if (typeof rec.path === "string") return rec.path;
      if (typeof rec.dest === "string") return rec.dest;
      if (typeof rec.source === "string") return rec.source;
      if (typeof rec.from_folder === "string") return rec.from_folder;
      if (typeof rec.app === "string") return rec.app;
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    /* plain */
  }
  return raw;
}

function approvalLine(session: AgentSession, pending: PendingAction) {
  const ja = session.locale === "ja";
  if (
    pending.toolName === "slack_post" ||
    /slack|post_message|chat\.post|send_message/i.test(pending.toolName)
  ) {
    return ja ? "そとにだしていい？" : "OK to send this outside?";
  }
  if (isDeskTool(pending.toolName)) {
    return ja ? "フォルダの外に出ていい？" : "OK to leave the granted folder?";
  }
  return ja ? "みとめる？" : "Allow this?";
}

export function resetAgents(petId?: string) {
  resetPetSessions(petId);
}
