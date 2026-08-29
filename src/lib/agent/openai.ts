import { executeTool, isGatedTool, toolsFor } from "./tools";
import type { LiveAgentId } from "./specs";
import type { Locale } from "@/lib/i18n/types";
import { DEFAULT_GRANTS, type PetGrants } from "@/lib/grants";
import {
  DEFAULT_PET_CONFIG,
  type PetConfig,
} from "@/lib/pet-config";
import { isDeskTool } from "./sandbox";
import { openaiEnv, routeForModel } from "./gateway";
import type {
  AgentSession,
  OpenAiMessage,
  OpenAiToolCall,
  PendingAction,
} from "./types";

export type OpenAiStatus = {
  ok: boolean;
  model: string | null;
  error?: string;
};

export function openaiConfig() {
  return openaiEnv();
}

export function probeOpenAi(): OpenAiStatus {
  const { apiKey, model } = openaiEnv();
  if (!apiKey) return { ok: false, model: null, error: "OPENAI_API_KEY missing" };
  return { ok: true, model };
}

type ChatResult = {
  text: string;
  messages: OpenAiMessage[];
  pending?: PendingAction;
};

export async function runOpenAiTurn(opts: {
  petId: LiveAgentId;
  locale: Locale;
  messages: OpenAiMessage[];
  grants?: PetGrants;
  config?: PetConfig;
  onProgress?: (progress: number, text: string) => void;
}): Promise<ChatResult> {
  const grants = opts.grants ?? DEFAULT_GRANTS;
  const config = opts.config ?? DEFAULT_PET_CONFIG;
  const routed = routeForModel(config.model);
  const fallback = openaiEnv();
  const apiKey = "auto" in routed ? fallback.apiKey : routed.apiKey;
  const baseUrl = "auto" in routed ? fallback.baseUrl : routed.baseUrl;
  const model = "auto" in routed ? fallback.model : routed.model;
  if (!apiKey) {
    throw new Error(
      "auto" in routed || routed.provider === "openai"
        ? "OPENAI_API_KEY missing"
        : "GEMINI_API_KEY missing"
    );
  }
  const tools = toolsFor(opts.petId, grants, config);
  const messages = [...opts.messages];
  let progress = 18;
  let text = "";

  for (let i = 0; i < 16; i++) {
    progress = Math.min(90, progress + 10);
    opts.onProgress?.(progress, text);
    const body = {
      model,
      messages: messages.map(toApiMessage),
      tools,
      tool_choice: "auto" as const,
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 280)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: OpenAiToolCall[];
        };
      }>;
    };
    const message = json.choices?.[0]?.message;
    if (!message) throw new Error("OpenAI returned no message");
    const assistant: OpenAiMessage = {
      role: "assistant",
      content: message.content ?? "",
      tool_calls: message.tool_calls,
    };
    messages.push(assistant);
    if (message.content) text = message.content;

    const calls = message.tool_calls ?? [];
    if (!calls.length) {
      return { text: (text || "").trim(), messages };
    }

    const gated = calls.find((c) =>
      isGatedTool(c.function.name, c.function.arguments, grants)
    );
    if (gated) {
      return {
        text: (text || askFor(opts.locale, gated.function.name)).trim(),
        messages,
        pending: {
          kind: "tool_approval",
          threadId: "openai",
          toolCallId: gated.id,
          toolName: gated.function.name,
          argsText: gated.function.arguments,
          openaiToolCall: {
            id: gated.id,
            name: gated.function.name,
            arguments: gated.function.arguments,
          },
        },
      };
    }

    for (const call of calls) {
      const result = await executeTool(
        call.function.name,
        call.function.arguments,
        opts.locale,
        grants,
        false,
        opts.petId,
        config
      );
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return { text: (text || "").trim(), messages };
}

export async function resumeOpenAiApproval(
  session: AgentSession,
  status: "allow" | "deny",
  onProgress?: (progress: number, text: string) => void
): Promise<ChatResult> {
  const pending = session.pending;
  const messages = [...(session.openaiMessages ?? [])];
  if (!pending?.openaiToolCall) {
    throw new Error("No pending OpenAI tool call");
  }
  const locale = session.locale;
  const grants = session.grants ?? DEFAULT_GRANTS;
  const config = session.config ?? DEFAULT_PET_CONFIG;
  if (status === "deny") {
    messages.push({
      role: "tool",
      tool_call_id: pending.openaiToolCall.id,
      content: JSON.stringify({
        ok: false,
        delivered: false,
        denied: true,
        reason: locale === "ja" ? "トレーナーが拒否" : "Trainer denied",
      }),
    });
  } else {
    const escape = isDeskTool(pending.openaiToolCall.name);
    const result = await executeTool(
      pending.openaiToolCall.name,
      pending.openaiToolCall.arguments,
      locale,
      grants,
      escape,
      session.petId as LiveAgentId,
      config
    );
    messages.push({
      role: "tool",
      tool_call_id: pending.openaiToolCall.id,
      content: result,
    });
  }
  return runOpenAiTurn({
    petId: session.petId as LiveAgentId,
    locale,
    messages,
    grants,
    config,
    onProgress,
  });
}

function toApiMessage(msg: OpenAiMessage) {
  if (msg.role === "tool") {
    return {
      role: "tool" as const,
      tool_call_id: msg.tool_call_id,
      content: msg.content,
    };
  }
  if (msg.role === "assistant" && msg.tool_calls?.length) {
    return {
      role: "assistant" as const,
      content: msg.content || null,
      tool_calls: msg.tool_calls,
    };
  }
  return { role: msg.role, content: msg.content };
}

function askFor(locale: Locale, toolName: string) {
  if (toolName === "slack_post") {
    return locale === "ja" ? "そとにだしていい？" : "OK to send this outside?";
  }
  return locale === "ja"
    ? "フォルダの外に出ていい？"
    : "OK to leave the granted folder?";
}
