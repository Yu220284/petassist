# Petassist（ぺたしすと）

**ペットをモニターに貼る。許可が見える。**

人はエージェントのライセンスが見えない。Petassist はポケットから動物を引き出し、モニターに付箋のように貼る。外に出せるのは犬だけで、それも Allow のあとだけ。

TrueForge は顔や仕事の中身ではなく、**エージェントを安全に回し続ける配管**です。モデルに「考えて、道具を使って、止まって、また考える」をやらせる実行層。ペットはその上の見せ方です。

> 仕事は MCP、安全は TrueForge、顔は Petassist

審査デモの1本の仕事は **TrueForge だけ** で回します。OpenAI フォールバックと Finder 権限はこの Mac 側のオーバーレイで、撮影ループには使いません。

## デスク

1. `npm run electron` でポケット窓が開く
2. 動物をドラッグしてモニターへドロップする（上端なら付箋スナップ）
3. またはポケット内の「上に貼る」

## 一本の仕事

未知の相手からメッセージが来る。ハーネスが回す。ペットが見せる。ログに `sandbox` / `subagent` / `MCP` が出る。

1. **ねこ (L0)** — TrueForge のサンドボックスを道具として使い、怪しい文面を隔離で開く。調べ物はサブエージェント＋読み取り MCP。送れない
2. **うさぎ (L2)** — 下書きする。write MCP はない
3. **いぬ (L3)** — write MCP（Slack など）を呼び、ハーネスのツール承認で止まる。Allow して初めて外に出る

6枠は見せる。動かすのはこの3体。

## セットアップ

```bash
cp .env.example .env.local
npm install
npm run dev
```

別ターミナル:

```bash
npm run electron
```

TrueForge（審査の本線）:

```bash
npx @truefoundry/trueforge
```

1. http://localhost:8790 → Settings → **Models**
2. Settings → **Sandbox providers** → Daytona（ねこの隔離実行に必須）
3. Settings → **Connectors** → 検索用 MCP と Slack（または同等の write）。名前は `web-search` / `slack` にするか、`.env.local` の `TRUEFORGE_MCP_SEARCH` / `TRUEFORGE_MCP_WRITE` で合わせる

詳細は [trueforge/README.md](trueforge/README.md)。

## 権限ティア

| Tier | 意味 | いま動かす |
|------|------|------------|
| L0 | みるだけ + サンドボックス | ねこ |
| L1 | れんしゅう（枠だけ） | ぺんぎん・ひよこ |
| L2 | そうあんまで | うさぎ |
| L3 | 本番 write・毎回しょうにん | いぬ |

たぬきは監査枠。今日のデモでは LLM を動かさない。

## スタック

- Next.js 15 + Tailwind 4
- Electron（ポケット窓 + 1匹1付箋の alwaysOnTop）
- TrueForge（ループ・MCP・サンドボックス・承認・サブエージェント）

## Qodo Code Review Evidence

ハッカソン提出の必須項目です。実質的な変更は `main` 直 push せず、GitHub PR を Qodo がレビューしてからマージします。チームの Qodo インストールは1つで足ります。

1. [app.qodo.ai](https://app.qodo.ai/signin) → GitHub にこのリポジトリを接続
2. ブランチを切って PR を開く。動かなければ PR に `/agentic_review`
3. 妥当な High は直す。違う・後回しなら Qodo スレッドで理由付き dismiss
4. 同じ PR に push し、必要ならもう一度 `/agentic_review`
5. マージした公開 PR の URL を下に書く

- Representative merged PR: https://github.com/Yu220284/pockassist/pull/1 _(merge after follow-up Qodo review)_
- What Qodo surfaced / what we changed or dismissed: High — loopback-only agent API and no unsigned `full_access`; accumulate TrueForge SSE deltas; complete sibling OpenAI tool responses; deny `run_command` unless `PETASSIST_ALLOW_FULL_ACCESS=1`. Medium — keep pending Allow across failed resumes; reset is loopback-only; Electron loads only localhost and blocks other navigations.
- Follow-up review: `/agentic_review` after the fix commit

スクショは補助、公開 PR リンクが証拠です。

## AI assistance

Cursor 上のコーディング支援を使っています。エージェントの役割分担、TrueForge の配線、承認 UI の判断は参加者が確認しています。

## Field report

提出用ブログの草稿。追記専用の HTML 1枚: [public/field-report.html](public/field-report.html)（開発中は `/field-report.html`）。過去の節は書き換えない。

## ライセンス・資産

- 動物アイコン: Nanashino `animalicon_kabane`（権利者の許諾範囲で使用）
- 公式ポケモン／任天堂資産は不使用
