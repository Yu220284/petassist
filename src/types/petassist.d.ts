export type DeskPins = { pinned: string[]; hidden: string[] };

export type DeskApi = {
  isDesk: true;
  pin: (id: string) => Promise<string[] | DeskPins>;
  unpin: (id: string) => Promise<string[] | DeskPins>;
  pinAllTop: () => Promise<string[] | DeskPins>;
  hideSticky: (id: string) => Promise<DeskPins>;
  showSticky: (id: string) => Promise<DeskPins>;
  resizeSticky: (
    id: string,
    mode: "compact" | "alert" | "choice" | "chat" | "menu" | "settings"
  ) => Promise<void>;
  pinned: () => Promise<string[] | DeskPins>;
  showDock: () => Promise<void>;
  openDirectory: () => Promise<string | null>;
  onPinned: (cb: (state: DeskPins) => void) => () => void;
};

declare global {
  interface Window {
    petassist?: DeskApi;
  }
}

export {};
