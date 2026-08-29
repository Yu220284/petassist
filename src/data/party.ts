export type PermissionTier = "L0" | "L1" | "L2" | "L3";
export type PartyStatus =
  | "idle"
  | "working"
  | "need_approval"
  | "stopped"
  | "failed"
  | "empty";

export type PartyMember = {
  id: string;
  name: string;
  nameJa: string;
  role: string;
  icon: string;
  accent: string;
  progress: number;
  tier: PermissionTier;
  status: PartyStatus;
  allowedTools: string[];
  deniedTools: string[];
  bubbles: Record<PartyStatus, string[]>;
};

export const LIVE_IDS = ["cat", "bunny", "dog"] as const;

export const TIER_LABEL: Record<PermissionTier, string> = {
  L0: "みるだけ",
  L1: "れんしゅう",
  L2: "そうあん",
  L3: "しょうにんつき",
};

export const TIER_COLOR: Record<PermissionTier, string> = {
  L0: "bg-slate-400",
  L1: "bg-sky-500",
  L2: "bg-amber-400",
  L3: "bg-orange-500",
};

export const STATUS_LABEL: Record<PartyStatus, string> = {
  idle: "稼働中",
  working: "作業中",
  need_approval: "しょうにんまち",
  stopped: "停止",
  failed: "失敗",
  empty: "空き",
};

export const STATUS_DOT: Record<PartyStatus, string> = {
  idle: "bg-emerald-500",
  working: "bg-sky-500",
  need_approval: "bg-orange-500",
  stopped: "bg-slate-400",
  failed: "bg-red-500",
  empty: "bg-slate-300",
};

const quiet: Record<PartyStatus, string[]> = {
  idle: [],
  working: [],
  need_approval: [],
  stopped: ["いま止まってるよ"],
  failed: ["うまくいかなかった…"],
  empty: [],
};

/** Demo party: max 6 slots. Empty slots use status empty. */
export const INITIAL_PARTY: PartyMember[] = [
  {
    id: "cat",
    name: "cat",
    nameJa: "ねこ",
    role: "リサーチ",
    icon: "/party/cat/02.png",
    accent: "#e8a07a",
    progress: 0,
    tier: "L0",
    status: "idle",
    allowedTools: ["web_search", "sandbox_run"],
    deniedTools: ["slack_post", "send_message"],
    bubbles: {
      idle: ["みてるよ", "権限はみるだけ！"],
      working: ["サンドボックスでしらべてる…", "ソースあつめてるよ"],
      need_approval: ["それ、わたしの権限じゃないよ"],
      stopped: ["しらべるの、いったん停止"],
      failed: ["ソース、読めなかった…", "しらべそこねた"],
      empty: [],
    },
  },
  {
    id: "penguin",
    name: "penguin",
    nameJa: "ぺんぎん",
    role: "データ",
    icon: "/party/penguin/04.png",
    accent: "#6ba8c9",
    progress: 0,
    tier: "L1",
    status: "stopped",
    allowedTools: ["sandbox_run", "csv_analyze"],
    deniedTools: ["slack_post", "db_write"],
    bubbles: {
      ...quiet,
      idle: ["さんぼっくすだいすき", "よちよち待機中"],
      working: ["さんぼっくすでれんしゅうちゅう", "しゅうちゅう…"],
      need_approval: ["そとの書き込みはむり！"],
      stopped: ["きょうは動かないよ"],
    },
  },
  {
    id: "bunny",
    name: "bunny",
    nameJa: "うさぎ",
    role: "文案",
    icon: "/party/bunny/02.png",
    accent: "#e7a4b6",
    progress: 0,
    tier: "L2",
    status: "idle",
    allowedTools: ["draft_reply", "edit_draft"],
    deniedTools: ["slack_post", "send_message"],
    bubbles: {
      idle: ["そうあんならまかせて", "下書き係だよ"],
      working: ["文案つくってる…", "ちょっと待ってね"],
      need_approval: ["投稿は犬さんにお願いして！"],
      stopped: ["下書き、止まってる"],
      failed: ["文案、まとまらなかった"],
      empty: [],
    },
  },
  {
    id: "dog",
    name: "dog",
    nameJa: "いぬ",
    role: "通知オペ",
    icon: "/party/dog/09.png",
    accent: "#d4b15a",
    progress: 0,
    tier: "L3",
    status: "idle",
    allowedTools: ["slack_post", "notify"],
    deniedTools: ["elevate_permissions", "billing"],
    bubbles: {
      idle: ["てくてく待機中", "本番はしょうにんつき！"],
      working: ["じゅんびちゅう…", "てくてく作業中"],
      need_approval: ["そとにだしていい？", "トレーナーさん！"],
      stopped: ["通知、止まってるよ"],
      failed: ["送れなかった…", "投稿ミスった"],
      empty: [],
    },
  },
  {
    id: "chick",
    name: "chick",
    nameJa: "ひよこ",
    role: "予定・街",
    icon: "/party/chick/02.png",
    accent: "#e3c45a",
    progress: 0,
    tier: "L1",
    status: "stopped",
    allowedTools: ["eta_mock", "calendar_read"],
    deniedTools: ["book_ride"],
    bubbles: {
      ...quiet,
      idle: ["パタパタ待機", "ETAみれるよ"],
      working: ["ばしょしらべ中", "パタパタ…"],
      need_approval: ["配車かくていはむり！"],
      stopped: ["きょうはおやすみ"],
    },
  },
  {
    id: "raccoondog",
    name: "raccoondog",
    nameJa: "たぬき",
    role: "監査",
    icon: "/party/raccoondog/06.png",
    accent: "#b7a894",
    progress: 0,
    tier: "L0",
    status: "stopped",
    allowedTools: ["audit_action", "warn"],
    deniedTools: ["slack_post", "send_message"],
    bubbles: {
      ...quiet,
      idle: ["みてるよ…", "あんぜん第一"],
      working: ["チェックちゅう", "あやしいところないかな"],
      need_approval: ["犬の投稿、中身みた？"],
      stopped: ["監査はあとで"],
    },
  },
];

export function pickBubble(member: PartyMember, localized?: string[]): string {
  const list = localized?.length ? localized : member.bubbles[member.status];
  if (!list?.length) return "…";
  return list[Math.floor(Math.random() * list.length)]!;
}

export function isLiveAgent(id: string) {
  return (LIVE_IDS as readonly string[]).includes(id);
}
