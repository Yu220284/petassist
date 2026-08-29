import type { AgentStreamEvent, AgentRuntime } from "./types";

export type TurnInput = {
  petId: string;
  locale: "ja" | "en";
  sessionId?: string;
  message?: string;
  approval?: "allow" | "deny";
  grants?: unknown;
  config?: unknown;
  requireHarness?: boolean;
};

export type TurnOutcome = {
  sessionId?: string;
  runtime?: AgentRuntime;
  text: string;
  progress: number;
  approval?: Extract<AgentStreamEvent, { type: "approval" }>;
  error?: string;
};

export async function streamAgentTurn(
  input: TurnInput,
  onEvent?: (event: AgentStreamEvent, out: TurnOutcome) => void
): Promise<TurnOutcome> {
  const res = await fetch("/api/agent/turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok || !res.body) {
    const fallback = await res.text().catch(() => "");
    return {
      text: "",
      progress: 0,
      error: fallback || `HTTP ${res.status}`,
    };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const out: TurnOutcome = { text: "", progress: 0 };
  while (true) {
    const { done, value } = await reader.read();
    buf += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as AgentStreamEvent;
        applyEvent(out, event);
        onEvent?.(event, out);
      } catch {
        /* skip */
      }
    }
    if (done) break;
  }
  if (buf.trim()) {
    try {
      const event = JSON.parse(buf) as AgentStreamEvent;
      applyEvent(out, event);
      onEvent?.(event, out);
    } catch {
      /* skip */
    }
  }
  return out;
}

function applyEvent(out: TurnOutcome, event: AgentStreamEvent) {
  if (event.type === "meta") {
    out.sessionId = event.sessionId;
    out.runtime = event.runtime;
  }
  if (event.type === "progress") out.progress = event.progress;
  if (event.type === "text") out.text = event.text;
  if (event.type === "approval") {
    out.approval = event;
    out.sessionId = event.sessionId;
    out.text = event.text;
  }
  if (event.type === "done") {
    out.sessionId = event.sessionId;
    out.text = event.text;
    out.progress = 100;
  }
  if (event.type === "error") out.error = event.message;
}

export type HarnessStatus = {
  runtime: AgentRuntime | null;
  trueforge: { ok: boolean; model: string | null; error?: string };
  openai: { ok: boolean; model: string | null; error?: string };
  mcp?: {
    names: string[];
    search: string | null;
    write: string | null;
  };
};

export async function fetchHarnessStatus(): Promise<HarnessStatus> {
  const res = await fetch("/api/agent/status", { cache: "no-store" });
  if (!res.ok) {
    return {
      runtime: null,
      trueforge: { ok: false, model: null, error: `HTTP ${res.status}` },
      openai: { ok: false, model: null },
      mcp: { names: [], search: null, write: null },
    };
  }
  return (await res.json()) as HarnessStatus;
}

export async function resetAgentSessions(petId?: string) {
  await fetch("/api/agent/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ petId }),
  });
}
