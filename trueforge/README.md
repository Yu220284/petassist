# TrueForge wiring (Petassist)

TrueForge is the pipe. Pets are the face.

Harness: [TrueForge](https://github.com/truefoundry/trueforge). MCP, skills, sandbox-as-a-tool, approvals, and subagents are built in. Sources: [introduction](https://trueforge.dev/introduction), [Harness Capabilities](https://trueforge.dev/key-features/overview), [Create an Agent](https://trueforge.dev/create-agent/overview).

```bash
npx @truefoundry/trueforge
# open http://localhost:8790
```

## Judges: turn the harness on

1. Settings → **Models** — add a provider (OpenAI credits from the live day work here).
2. Settings → **Sandbox providers** — Daytona. Without this, `sandbox.enabled` on the cat does not isolate code.
3. Settings → **Connectors** — a read-only search MCP for the cat, a write MCP (Slack or similar) for the dog.

Name connectors `web-search` and `slack`, or set:

```
TRUEFORGE_MCP_SEARCH=your-search-connector-name
TRUEFORGE_MCP_WRITE=your-slack-connector-name
```

The desk lists connectors and attaches them on session create:

| Pet | Attached | Policy |
|-----|----------|--------|
| cat | search MCP | `enable_tools: ["@read-only"]` + sandbox + subagents |
| bunny | none | draft only |
| dog | write MCP | `require_approval_for_tools: ["@write", "@destructive"]` + ask_user_question |

The filmed job (`この仕事を任せる`) sets `requireHarness` and **does not** fall back to OpenAI. Finder folder grants stay a Petassist overlay for ad-hoc chat, not the scored loop.

If write MCP is missing, the dog still pauses with `ask_user_question`. Attach Slack for the tool-approval demo.

## Specs on disk

| Pet | TrueForge strength | Spec |
|-----|--------------------|------|
| cat | Sandbox-as-a-tool + subagents + read MCP | `agents/cat-researcher.json` |
| bunny | Draft only, no write MCP | `agents/bunny-drafter.json` |
| dog | Tool approval on write MCP | `agents/dog-notifier.json` |
| penguin | Extra sandbox slot, idle in the filmed loop | `agents/penguin-sandbox.json` |

The live desk sends an inline spec (`trueForgeAgentSpec`) so library import is optional. Import JSON only after connector names match.

```bash
cp .env.example .env.local
npm run dev
```
