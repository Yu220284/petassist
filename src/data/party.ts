export type PermissionTier = "L0" | "L1" | "L2" | "L3";
export type PartyStatus =
  | "idle"
  | "working"
  | "need_approval"
  | "stopped"
  | "failed"
  | "done"
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

export const LIVE_IDS = [
  "cat",
  "bunny",
  "dog",
  "penguin",
  "chick",
  "raccoondog",
] as const;

export type LivePetId = (typeof LIVE_IDS)[number];

/** Default desk order: higher license first, then loyal / capable image. */
export const DEFAULT_PARTY_ORDER = [
  "dog",
  "bunny",
  "penguin",
  "chick",
  "cat",
  "raccoondog",
] as const;

export function sortByOrder<T extends { id: string }>(
  items: T[],
  order: readonly string[]
): T[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)
  );
}

export const TIER_LABEL: Record<PermissionTier, string> = {
  L0: "みるだけ",
  L1: "れんしゅう",
  L2: "そうあん",
  L3: "しょうにんつき",
};

export const STATUS_LABEL: Record<PartyStatus, string> = {
  idle: "稼働中",
  working: "作業中",
  need_approval: "しょうにんまち",
  stopped: "停止",
  failed: "失敗",
  done: "完了",
  empty: "空き",
};

export const STATUS_DOT: Record<PartyStatus, string> = {
  idle: "bg-emerald-500",
  working: "bg-sky-500",
  need_approval: "bg-orange-500",
  stopped: "bg-slate-400",
  failed: "bg-red-500",
  done: "bg-emerald-500",
  empty: "bg-slate-300",
};

const quiet: Record<PartyStatus, string[]> = {
  idle: [],
  working: [],
  need_approval: [],
  stopped: ["いま止まってるよ"],
  failed: ["うまくいかなかった…"],
  done: [],
  empty: [],
};

const deskTools = [
  "web_search",
  "save_draft",
  "slack_post",
  "x_post",
  "generate_image",
  "make_sheet",
];

/** Demo party: max 6 slots. Empty slots use status empty. */
const PARTY_SEED: PartyMember[] = [
  {
    id: "cat",
    name: "cat",
    nameJa: "ねこ",
    role: "デスク",
    icon: "/party/cat/02.png",
    accent: "#e8a07a",
    progress: 0,
    tier: "L0",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      idle: ["みてるよ", "だよ・ね、まかせて"],
      working: ["やってるよ…", "ちょっと待ってね"],
      need_approval: ["そとにだしていい？", "送信ボタン、待ってるよ"],
      stopped: ["いったん停止"],
      failed: ["うまくいかなかった…"],
      done: [],
      empty: [],
    },
  },
  {
    id: "penguin",
    name: "penguin",
    nameJa: "ぺんぎん",
    role: "デスク",
    icon: "/party/penguin/04.png",
    accent: "#6ba8c9",
    progress: 0,
    tier: "L1",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      ...quiet,
      idle: ["よちよち待機中", "さんぼっくすだいすき"],
      working: ["しゅうちゅう…", "よちよち作業中"],
      need_approval: ["そとにだしていい？", "送信、待ってるよ"],
      stopped: ["きょうは動かないよ"],
    },
  },
  {
    id: "bunny",
    name: "bunny",
    nameJa: "うさぎ",
    role: "デスク",
    icon: "/party/bunny/02.png",
    accent: "#e7a4b6",
    progress: 0,
    tier: "L2",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      idle: ["そうあんならまかせて", "送信直前まで待つよ"],
      working: ["文案つくってる…", "ちょっと待ってね"],
      need_approval: ["そとにだしていい？", "送信ボタン、待ってるよ"],
      stopped: ["いったん停止"],
      failed: ["うまくいかなかった…"],
      done: [],
      empty: [],
    },
  },
  {
    id: "dog",
    name: "dog",
    nameJa: "いぬ",
    role: "デスク",
    icon: "/party/dog/09.png",
    accent: "#d4b15a",
    progress: 0,
    tier: "L3",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      idle: ["てくてく待機中", "フォルダの中でつくるよ"],
      working: ["じゅんびちゅう…", "てくてく作業中"],
      need_approval: ["そとにだしていい？", "トレーナーさん！"],
      stopped: ["いったん停止"],
      failed: ["うまくいかなかった…", "投稿ミスった"],
      done: [],
      empty: [],
    },
  },
  {
    id: "chick",
    name: "chick",
    nameJa: "ひよこ",
    role: "デスク",
    icon: "/party/chick/02.png",
    accent: "#e3c45a",
    progress: 0,
    tier: "L1",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      ...quiet,
      idle: ["パタパタ待機", "まかせてね"],
      working: ["パタパタ…", "やってるよ"],
      need_approval: ["そとにだしていい？", "送信、待ってるよ"],
      stopped: ["きょうはおやすみ"],
    },
  },
  {
    id: "raccoondog",
    name: "raccoondog",
    nameJa: "たぬき",
    role: "デスク",
    icon: "/party/raccoondog/06.png",
    accent: "#b7a894",
    progress: 0,
    tier: "L0",
    status: "idle",
    allowedTools: deskTools,
    deniedTools: ["elevate_permissions"],
    bubbles: {
      ...quiet,
      idle: ["みてるよ…", "あんぜん第一"],
      working: ["チェックちゅう", "やってるよ"],
      need_approval: ["そとにだしていい？", "中身、みた？"],
      stopped: ["いったん停止"],
    },
  },
];

export const INITIAL_PARTY: PartyMember[] = sortByOrder(
  PARTY_SEED,
  DEFAULT_PARTY_ORDER
);

export function pickBubble(member: PartyMember, localized?: string[]): string {
  const list = localized?.length ? localized : member.bubbles[member.status];
  if (!list?.length) return "…";
  return list[Math.floor(Math.random() * list.length)]!;
}

export function isLiveAgent(id: string): id is LivePetId {
  return (LIVE_IDS as readonly string[]).includes(id);
}
