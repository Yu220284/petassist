# Petassist（ぺたしすと）

**Stick it on the desk. Stickable AI agents.**

Petassist gives AI agents only the minimum permissions they need, then pins them on the monitor like sticky notes so you can watch them run. They only act inside the scope you granted.

[TrueForge](https://github.com/truefoundry/trueforge) is the plumbing that keeps those agents running safely.

## Desk

1. `npm run electron` opens the pocket window and one desk avatar (Bake.Ch style — only one moves at a time).
2. Click the avatar to chat a job — or assign work from the dock.
3. Species and coat are optional looks; swapping them replaces the single sticky.

For example:

1. **Cat (L0)** — Uses TrueForge’s sandbox as a tool to open untrusted text in isolation. Research goes through a subagent plus a read-only MCP. Cannot send.
2. **Bunny (L2)** — Drafts. No write MCP.
3. **Dog (L3)** — Calls a write MCP (Slack, etc.) and stops for harness tool approval. Nothing leaves until you Allow.

One avatar on the desk at a time. Obake / Bake.Ch ghost is not part of this roster.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

In another terminal:

```bash
npm run electron
```

Agents need TrueForge on localhost:

```bash
npx @truefoundry/trueforge
```

Then Settings → **Models**. For the cat, add a Daytona sandbox provider. Name search/write connectors `web-search` / `slack`, or match `TRUEFORGE_MCP_SEARCH` / `TRUEFORGE_MCP_WRITE` in `.env.local`.

Animal icons: Yu Iwase.
