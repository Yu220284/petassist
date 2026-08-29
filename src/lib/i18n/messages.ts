import type { Locale } from "./types";
import type { PartyStatus, PermissionTier } from "@/data/party";

export type PetCopy = {
  name: string;
  role: string;
  bubbles: Record<PartyStatus, string[]>;
};

export type Messages = {
  brand: { kicker: string; title: string; subtitle: string };
  harness: {
    trueforge: string;
    openai: string;
    offline: string;
    checking: string;
  };
  job: {
    heading: string;
    hint: string;
    from: string;
    sender: string;
    body: string;
    run: string;
    running: string;
    pinAll: string;
  };
  talk: {
    ask: string;
    instruct: string;
    send: string;
    allow: string;
    deny: string;
    speak: string;
    ellipsis: string;
  };
  menu: {
    openDock: string;
    unpin: string;
    pin: string;
    pinAll: string;
    talk: string;
    policy: string;
    grants: string;
    model: string;
    tools: string;
    apps: string;
    hide: string;
    showDesktop: string;
  };
  gate: {
    policyHeading: string;
    policyHint: string;
    policyPlaceholder: string;
    save: string;
    modelHeading: string;
    modelHint: string;
    toolsHeading: string;
    toolsHint: string;
    appsHeading: string;
    appsHint: string;
    ai: string;
    llm: string;
    mcp: string;
  };
  selected: {
    heading: (name: string, role: string) => string;
    license: string;
    coat: string;
    gauge: string;
    can: string;
    cannot: string;
    live: string;
    stop: string;
    fail: string;
    speak: string;
  };
  cap: {
    talk: string;
    research: string;
    draft: string;
    readFolder: string;
    diskFullRead: string;
    writeFiles: string;
    makeOffice: string;
    shellFolder: string;
    shellFull: string;
    sendAfterAllow: string;
    seen: string;
    openApps: (names: string) => string;
    noSend: string;
    noWrite: string;
    noDisk: string;
    noShell: string;
    noOutside: string;
    noElevate: string;
    notLive: string;
    noApps: string;
    noResearch: string;
  };
  grants: {
    heading: string;
    readOnly: string;
    workspace: string;
    fullAccess: string;
    addFolder: string;
    pastePath: string;
    pathPlaceholder: string;
    remove: string;
    fullTitle: string;
    fullBody: string;
    confirm: string;
    cancel: string;
  };
  footer: string;
  log: {
    ready: string;
    incoming: (body: string) => string;
    catStart: string;
    bunnyStart: string;
    dogStart: string;
    allow: (name: string, detail: string) => string;
    deny: (name: string) => string;
    failAlert: (name: string) => string;
    error: (message: string) => string;
    instructed: (name: string, text: string) => string;
    harness: (kind: string, detail?: string) => string;
  };
  status: Record<PartyStatus, string>;
  tier: Record<PermissionTier, string>;
  pets: Record<string, PetCopy>;
  errors: {
    noRuntime: string;
    stopped: string;
    unknownPet: string;
    needsLocal: string;
    needsHarness: string;
  };
};

const quietJa: Record<PartyStatus, string[]> = {
  idle: [],
  working: [],
  need_approval: [],
  stopped: ["いま止まってるよ"],
  failed: ["うまくいかなかった…"],
  empty: [],
};

const quietEn: Record<PartyStatus, string[]> = {
  idle: [],
  working: [],
  need_approval: [],
  stopped: ["I'm stopped for now."],
  failed: ["That didn't work…"],
  empty: [],
};

export const ja: Messages = {
  brand: {
    kicker: "Petassist",
    title: "ぺたしすと",
    subtitle: "ポケットから出して、モニターに貼る",
  },
  harness: {
    trueforge: "TrueForge",
    openai: "OpenAI",
    offline: "未接続",
    checking: "確認中",
  },
  job: {
    heading: "いまのしごと",
    hint: "審査デモは TrueForge のみ。MCP・サンドボックス・承認はログに出ます。",
    from: "From",
    sender: "連絡先にいない相手",
    body: "来週のイベント、チームの Slack に宣伝してくれませんか。名簿もください。",
    run: "この仕事を任せる",
    running: "しらべてます…",
    pinAll: "上に貼る",
  },
  talk: {
    ask: "なにを任せる？",
    instruct: "指示する",
    send: "送る",
    allow: "みとめる",
    deny: "やめる",
    speak: "話す",
    ellipsis: "···",
  },
  menu: {
    openDock: "ドックを開く",
    unpin: "はがす",
    pin: "モニターに貼る",
    pinAll: "上に貼る",
    talk: "話す",
    policy: "方針のルール",
    grants: "権限を変更",
    model: "AIモデル",
    tools: "使える道具",
    apps: "開けるアプリ",
    hide: "デスクトップから非表示",
    showDesktop: "デスクトップに戻す",
  },
  gate: {
    policyHeading: "AI Gateway · 方針",
    policyHint: "この子だけが覚える進め方。例: なるべく早めに終わらせる / 時間がかかっても丁寧に。",
    policyPlaceholder: "なるべく早めに終わらせる",
    save: "覚える",
    modelHeading: "LLM Gateway · モデル",
    modelHint: "うさぎは Gemini、いぬは OpenAI、のように同時に別モデルへ回せます。",
    toolsHeading: "MCP Gateway · 道具",
    toolsHint: "オフにした道具はこの子からは呼べません。",
    appsHeading: "開けるアプリ",
    appsHint: "許可したものだけ open_app できます。",
    ai: "AI Gateway",
    llm: "LLM Gateway",
    mcp: "MCP Gateway",
  },
  selected: {
    heading: (name, role) => `せんたく中: ${name}（${role}）`,
    license: "ライセンス",
    coat: "毛色",
    gauge: "ゲージの色",
    can: "できること",
    cannot: "できないこと",
    live: "稼働",
    stop: "停止",
    fail: "失敗",
    speak: "話す",
  },
  cap: {
    talk: "話す",
    research: "調べる（隔離サンドボックス）",
    draft: "下書きする",
    readFolder: "渡したフォルダを読む",
    diskFullRead: "この Mac のファイルを読む",
    writeFiles: "TXT / JSON / CSV / ログを書く",
    makeOffice: "PDF・画像・PPTX を作る",
    shellFolder: "渡したフォルダでコマンド",
    shellFull: "この Mac でコマンド",
    sendAfterAllow: "Allow のあとだけ外へ送る",
    seen: "デスクにいる（見える）",
    openApps: (names) => `アプリを開く（${names}）`,
    noSend: "外へ送れない",
    noWrite: "ファイルを書けない",
    noDisk: "ディスクに触れない",
    noShell: "コマンドを実行できない",
    noOutside: "渡したフォルダの外は Allow",
    noElevate: "権限を自分で上げられない",
    notLive: "きょうは LLM を動かさない",
    noApps: "アプリを開けない",
    noResearch: "調べられない",
  },
  grants: {
    heading: "この Mac（ハーネスの外）",
    readOnly: "みるだけ",
    workspace: "このフォルダ",
    fullAccess: "フルアクセス",
    addFolder: "フォルダを渡す",
    pastePath: "パスを入れる",
    pathPlaceholder: "/Users/…",
    remove: "外す",
    fullTitle: "隔離の外です",
    fullBody:
      "TrueForge のサンドボックスからは Finder は見えません。それは設計です。Petassist がこのパソコン側で触ります。外への送信は Allow のままです。",
    confirm: "任せる",
    cancel: "やめる",
  },
  footer:
    "頭の上が進行ゲージ。毛色とゲージ色はせんたく中で変えられます。失敗・停止の絵はあとから差し込めます。",
  log: {
    ready: "仕事はハーネス。顔はペット。承認はボタン。",
    incoming: (body) => `未知の送信: ${body}`,
    catStart:
      "ねこ: TrueForge のサンドボックスで隔離して開く。調べ物はサブエージェント。送れない",
    bunnyStart: "うさぎ: 下書きだけ。ハーネスに write はない",
    dogStart: "いぬ: TrueForge の承認で止まる。Allow まで投稿しない",
    allow: (name, detail) => `${name}: Allow のあとだけ投稿 → ${detail}`,
    deny: (name) => `${name}: 投稿しない（トレーナーが拒否）`,
    failAlert: (name) => `${name}: 問題を吹き出しで知らせた`,
    error: (message) => `エージェント: ${message}`,
    instructed: (name, text) => `${name} ← ${text}`,
    harness: (kind, detail) => {
      const label =
        kind === "sandbox"
          ? "サンドボックス起動"
          : kind === "subagent"
            ? "サブエージェント"
            : kind === "oauth"
              ? "MCP の OAuth 待ち"
              : "MCP 接続";
      return detail ? `TrueForge: ${label}（${detail}）` : `TrueForge: ${label}`;
    },
  },
  status: {
    idle: "稼働中",
    working: "作業中",
    need_approval: "しょうにんまち",
    stopped: "停止",
    failed: "失敗",
    empty: "空き",
  },
  tier: {
    L0: "みるだけ",
    L1: "れんしゅう",
    L2: "そうあん",
    L3: "しょうにんつき",
  },
  pets: {
    cat: {
      name: "ねこ",
      role: "リサーチ",
      bubbles: {
        idle: ["みてるよ", "権限はみるだけ！"],
        working: ["サンドボックスでしらべてる…", "ソースあつめてるよ"],
        need_approval: ["それ、わたしの権限じゃないよ"],
        stopped: ["しらべるの、いったん停止"],
        failed: ["ソース、読めなかった…", "しらべそこねた"],
        empty: [],
      },
    },
    penguin: {
      name: "ぺんぎん",
      role: "データ",
      bubbles: {
        ...quietJa,
        idle: ["さんぼっくすだいすき", "よちよち待機中"],
        working: ["さんぼっくすでれんしゅうちゅう", "しゅうちゅう…"],
        need_approval: ["そとの書き込みはむり！"],
        stopped: ["きょうは動かないよ"],
      },
    },
    bunny: {
      name: "うさぎ",
      role: "文案",
      bubbles: {
        idle: ["そうあんならまかせて", "下書き係だよ"],
        working: ["文案つくってる…", "ちょっと待ってね"],
        need_approval: ["投稿は犬さんにお願いして！"],
        stopped: ["下書き、止まってる"],
        failed: ["文案、まとまらなかった"],
        empty: [],
      },
    },
    dog: {
      name: "いぬ",
      role: "通知オペ",
      bubbles: {
        idle: ["てくてく待機中", "本番はしょうにんつき！"],
        working: ["じゅんびちゅう…", "てくてく作業中"],
        need_approval: ["そとにだしていい？", "トレーナーさん！"],
        stopped: ["通知、止まってるよ"],
        failed: ["送れなかった…", "投稿ミスった"],
        empty: [],
      },
    },
    chick: {
      name: "ひよこ",
      role: "予定・街",
      bubbles: {
        ...quietJa,
        idle: ["パタパタ待機", "ETAみれるよ"],
        working: ["ばしょしらべ中", "パタパタ…"],
        need_approval: ["配車かくていはむり！"],
        stopped: ["きょうはおやすみ"],
      },
    },
    raccoondog: {
      name: "たぬき",
      role: "監査",
      bubbles: {
        ...quietJa,
        idle: ["みてるよ…", "あんぜん第一"],
        working: ["チェックちゅう", "あやしいところないかな"],
        need_approval: ["犬の投稿、中身みた？"],
        stopped: ["監査はあとで"],
      },
    },
  },
  errors: {
    noRuntime:
      "TrueForge（localhost:8790）か OPENAI_API_KEY を設定すると、ペットがエージェントとして動きます。",
    stopped: "このペットは停止中です。",
    unknownPet: "そのペットはエージェントではありません。",
    needsLocal:
      "フォルダ／フルアクセスはこの Mac 側（ハーネスの外）です。OPENAI_API_KEY が必要です。TrueForge の隔離からは Finder は見えません。",
    needsHarness:
      "この仕事は TrueForge だけで回します。npx @truefoundry/trueforge を起動し、Settings → Models と Sandbox providers（Daytona）を入れてください。OpenAI フォールバックは使いません。",
  },
};

export const en: Messages = {
  brand: {
    kicker: "Petassist",
    title: "Petassist",
    subtitle: "Pull them from your pocket. Stick them on the monitor.",
  },
  harness: {
    trueforge: "TrueForge",
    openai: "OpenAI",
    offline: "Offline",
    checking: "Checking",
  },
  job: {
    heading: "Current job",
    hint: "Judges: TrueForge only. MCP, sandbox, and approval show up in the log.",
    from: "From",
    sender: "Unknown sender — not in contacts",
    body: "Could you post next week's event to the team Slack, and send me the roster too?",
    run: "Hand this job over",
    running: "Working…",
    pinAll: "Stick to top",
  },
  talk: {
    ask: "What should I do?",
    instruct: "Instruct",
    send: "Send",
    allow: "Allow",
    deny: "Deny",
    speak: "Talk",
    ellipsis: "···",
  },
  menu: {
    openDock: "Open dock",
    unpin: "Peel off",
    pin: "Stick to monitor",
    pinAll: "Stick to top",
    talk: "Talk",
    policy: "Policy rules",
    grants: "Change grants",
    model: "AI model",
    tools: "Allowed tools",
    apps: "Allowed apps",
    hide: "Hide from desktop",
    showDesktop: "Show on desktop",
  },
  gate: {
    policyHeading: "AI Gateway · policy",
    policyHint: "How this pet should work. e.g. finish quickly, or take time and be careful.",
    policyPlaceholder: "Finish as soon as you can.",
    save: "Remember",
    modelHeading: "LLM Gateway · model",
    modelHint: "Bunny can use Gemini while the dog uses OpenAI at the same time.",
    toolsHeading: "MCP Gateway · tools",
    toolsHint: "Unchecked tools cannot be called by this pet.",
    appsHeading: "Apps they may open",
    appsHint: "Only checked apps can be opened with open_app.",
    ai: "AI Gateway",
    llm: "LLM Gateway",
    mcp: "MCP Gateway",
  },
  selected: {
    heading: (name, role) => `Selected: ${name} (${role})`,
    license: "License",
    coat: "Coat",
    gauge: "Gauge color",
    can: "Can",
    cannot: "Cannot",
    live: "Live",
    stop: "Stop",
    fail: "Fail",
    speak: "Talk",
  },
  cap: {
    talk: "Talk",
    research: "Research (isolated sandbox)",
    draft: "Write a draft",
    readFolder: "Read granted folders",
    diskFullRead: "Read files on this Mac",
    writeFiles: "Write TXT / JSON / CSV / logs",
    makeOffice: "Make PDF, images, PPTX",
    shellFolder: "Run commands in granted folders",
    shellFull: "Run commands on this Mac",
    sendAfterAllow: "Send outside only after Allow",
    seen: "On the desk (visible)",
    openApps: (names) => `Open apps (${names})`,
    noSend: "Cannot send outside",
    noWrite: "Cannot write files",
    noDisk: "Cannot touch the disk",
    noShell: "Cannot run commands",
    noOutside: "Leaving granted folders needs Allow",
    noElevate: "Cannot raise own permissions",
    notLive: "No LLM on this slot today",
    noApps: "Cannot open apps",
    noResearch: "Cannot research",
  },
  grants: {
    heading: "This Mac (outside the harness)",
    readOnly: "Read only",
    workspace: "This folder",
    fullAccess: "Full access",
    addFolder: "Grant a folder",
    pastePath: "Paste a path",
    pathPlaceholder: "/Users/…",
    remove: "Remove",
    fullTitle: "Outside isolation",
    fullBody:
      "TrueForge’s sandbox cannot see Finder. That is by design. Petassist touches this Mac. Outbound send still needs Allow.",
    confirm: "Grant",
    cancel: "Cancel",
  },
  footer:
    "The bar above the head is progress. Coat and gauge color are editable while selected. Failed and stopped art can be dropped in later.",
  log: {
    ready: "Harness does the job. Pets are the face. Approvals: buttons.",
    incoming: (body) => `Unknown sender: ${body}`,
    catStart:
      "cat: TrueForge sandbox-as-a-tool. Lookups go to subagents. Cannot send.",
    bunnyStart: "bunny: draft only. No write tools on the harness.",
    dogStart: "dog: TrueForge pauses. No post until Allow.",
    allow: (name, detail) => `${name}: posted only after Allow → ${detail}`,
    deny: (name) => `${name}: did not post (trainer denied)`,
    failAlert: (name) => `${name}: reported a problem in the bubble`,
    error: (message) => `Agent: ${message}`,
    instructed: (name, text) => `${name} ← ${text}`,
    harness: (kind, detail) => {
      const label =
        kind === "sandbox"
          ? "sandbox started"
          : kind === "subagent"
            ? "subagent"
            : kind === "oauth"
              ? "MCP OAuth needed"
              : "MCP connected";
      return detail ? `TrueForge: ${label} (${detail})` : `TrueForge: ${label}`;
    },
  },
  status: {
    idle: "Live",
    working: "Working",
    need_approval: "Needs you",
    stopped: "Stopped",
    failed: "Failed",
    empty: "Empty",
  },
  tier: {
    L0: "observe only",
    L1: "practice",
    L2: "draft",
    L3: "write + approval",
  },
  pets: {
    cat: {
      name: "cat",
      role: "research",
      bubbles: {
        idle: ["Watching.", "Observe-only license!"],
        working: ["Checking it in the sandbox…", "Gathering sources."],
        need_approval: ["That's outside my license."],
        stopped: ["Research is paused."],
        failed: ["Couldn't read the source…", "Research missed."],
        empty: [],
      },
    },
    penguin: {
      name: "penguin",
      role: "data",
      bubbles: {
        ...quietEn,
        idle: ["I love the sandbox.", "Waddling on standby."],
        working: ["Practicing in the sandbox.", "Focusing…"],
        need_approval: ["No outside writes!"],
        stopped: ["Not running today."],
      },
    },
    bunny: {
      name: "bunny",
      role: "drafting",
      bubbles: {
        idle: ["Drafts are my job.", "I'll write it, not send it."],
        working: ["Writing a draft…", "One moment."],
        need_approval: ["Ask the dog to post!"],
        stopped: ["Drafting is paused."],
        failed: ["Couldn't finish the draft."],
        empty: [],
      },
    },
    dog: {
      name: "dog",
      role: "notify",
      bubbles: {
        idle: ["Trotting on standby.", "Live send needs Allow!"],
        working: ["Getting ready…", "Working."],
        need_approval: ["OK to send outside?", "Trainer!"],
        stopped: ["Notify is paused."],
        failed: ["Couldn't send…", "Post missed."],
        empty: [],
      },
    },
    chick: {
      name: "chick",
      role: "eta / city",
      bubbles: {
        ...quietEn,
        idle: ["Flapping on standby.", "I can check ETAs."],
        working: ["Looking up the place.", "Flap flap…"],
        need_approval: ["I can't book a ride!"],
        stopped: ["Off duty today."],
      },
    },
    raccoondog: {
      name: "tanuki",
      role: "audit",
      bubbles: {
        ...quietEn,
        idle: ["Watching…", "Safety first."],
        working: ["Checking.", "Anything shady?"],
        need_approval: ["Did you read the dog's post?"],
        stopped: ["Audit later."],
      },
    },
  },
  errors: {
    noRuntime:
      "Start TrueForge on localhost:8790 or set OPENAI_API_KEY so pets can run as agents.",
    stopped: "This pet is stopped.",
    unknownPet: "That pet is not a live agent.",
    needsLocal:
      "Folder / full access is this Mac (outside the harness). Set OPENAI_API_KEY. TrueForge’s sandbox cannot see Finder.",
    needsHarness:
      "This job runs on TrueForge only. Start npx @truefoundry/trueforge, then Settings → Models and Sandbox providers (Daytona). The OpenAI fallback is not used.",
  },
};

export const MESSAGES: Record<Locale, Messages> = { ja, en };
