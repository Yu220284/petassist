export type DeskPins = { pinned: string[]; hidden: string[] };

export type DeskApi = {
  isDesk: true;
  pin: (id: string) => Promise<string[] | DeskPins>;
  unpin: (id: string) => Promise<string[] | DeskPins>;
  pinAllTop: (
    ids?: string[],
    opts?: { confirm?: boolean }
  ) => Promise<string[] | DeskPins>;
  hideSticky: (id: string) => Promise<DeskPins>;
  leapPet: (id: string, motion: "in" | "out") => Promise<DeskPins>;
  showSticky: (id: string) => Promise<DeskPins>;
  resizeSticky: (
    id: string,
    mode: "compact" | "alert" | "choice" | "chat" | "menu" | "settings"
  ) => Promise<void>;
  pinned: () => Promise<string[] | DeskPins>;
  showDock: () => Promise<void>;
  dragBegin: () => void;
  dragMove: () => void;
  dragEnd: () => void;
  followCursor: (id: string) => void;
  openDirectory: () => Promise<string | null>;
  notify?: (opts: { title: string; body: string }) => Promise<boolean>;
  openPreview?: (opts: {
    id: string;
    kind: "image" | "sheet";
    petId?: string;
  }) => Promise<void>;
  onPinned: (cb: (state: DeskPins) => void) => () => void;
};

declare global {
  interface Window {
    petassist?: DeskApi;
  }
}

export {};
