const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("path");

function deskBase() {
  const fallback = "http://127.0.0.1:3000";
  const raw = process.env.PETASSIST_URL || fallback;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const loopback =
      host === "127.0.0.1" || host === "localhost" || host === "::1";
    const http = url.protocol === "http:" || url.protocol === "https:";
    if (loopback && http) return url.origin;
  } catch {
    /* fall through */
  }
  return fallback;
}

const BASE = deskBase();
const STICKY_W = 110;
const STICKY_H = 200;
const TOP_SNAP_PX = 56;
const PARTY_ORDER = ["cat", "penguin", "bunny", "dog", "chick", "raccoondog"];
const STICKY_SIZES = {
  compact: { width: 110, height: 200 },
  alert: { width: 252, height: 360 },
  choice: { width: 252, height: 380 },
  chat: { width: 252, height: 360 },
  menu: { width: 210, height: 380 },
  settings: { width: 292, height: 520 },
};

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {Map<string, BrowserWindow>} */
const stickies = new Map();

function preloadPath() {
  return path.join(__dirname, "preload.js");
}

function lockToDesk(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, next) => {
    if (!next.startsWith(BASE)) event.preventDefault();
  });
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    minWidth: 380,
    minHeight: 640,
    title: "Petassist",
    backgroundColor: "#eef3f9",
    webPreferences: {
      preload: preloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  lockToDesk(mainWindow);
  mainWindow.loadURL(`${BASE}/`);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}

function stickyWebPrefs() {
  return {
    preload: preloadPath(),
    nodeIntegration: false,
    contextIsolation: true,
  };
}

function clampToDisplay(x, y, display) {
  const b = display.workArea;
  const cx = Math.min(Math.max(x, b.x), b.x + b.width - STICKY_W);
  const cy = Math.min(Math.max(y, b.y), b.y + b.height - STICKY_H);
  return { x: Math.round(cx), y: Math.round(cy) };
}

function snapIfNearTop(point, display) {
  const b = display.workArea;
  if (point.y <= b.y + TOP_SNAP_PX) {
    return { x: point.x - STICKY_W / 2, y: b.y };
  }
  return { x: point.x - STICKY_W / 2, y: point.y - STICKY_H / 2 };
}

/** @type {Set<string>} */
const hiddenStickies = new Set();

function broadcastPinned() {
  const payload = {
    pinned: [...stickies.keys()],
    hidden: [...hiddenStickies],
  };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send("pet:pinned-changed", payload);
  }
}

function placeSticky(id, x, y) {
  const display = screen.getDisplayNearestPoint({ x, y });
  const pos = clampToDisplay(x, y, display);
  const existing = stickies.get(id);

  if (existing && !existing.isDestroyed()) {
    existing.setPosition(pos.x, pos.y);
    existing.show();
    hiddenStickies.delete(id);
    return existing;
  }

  const win = new BrowserWindow({
    width: STICKY_W,
    height: STICKY_H,
    x: pos.x,
    y: pos.y,
    transparent: true,
    backgroundColor: "#00000000",
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    titleBarStyle: "hidden",
    ...(process.platform === "darwin" ? { type: "panel" } : {}),
    webPreferences: stickyWebPrefs(),
  });

  lockToDesk(win);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(true, "floating");
  if (process.platform === "darwin") {
    win.setWindowButtonVisibility(false);
  }
  win.loadURL(`${BASE}/pet?id=${encodeURIComponent(id)}`);
  win.on("closed", () => {
    stickies.delete(id);
    hiddenStickies.delete(id);
    broadcastPinned();
  });
  stickies.set(id, win);
  hiddenStickies.delete(id);
  return win;
}

function pinAtCursor(id) {
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const snapped = snapIfNearTop(point, display);
  placeSticky(id, snapped.x, snapped.y);
  broadcastPinned();
}

function pinAllTop() {
  const area = screen.getPrimaryDisplay().workArea;
  const gap = 6;
  const total = PARTY_ORDER.length * STICKY_W + (PARTY_ORDER.length - 1) * gap;
  let x = area.x + Math.max(12, Math.round((area.width - total) / 2));
  const y = area.y;
  for (const id of PARTY_ORDER) {
    placeSticky(id, x, y);
    x += STICKY_W + gap;
  }
  broadcastPinned();
}

ipcMain.handle("pet:pin", (_event, { id }) => {
  if (typeof id !== "string") return;
  pinAtCursor(id);
  return [...stickies.keys()];
});

ipcMain.handle("pet:unpin", (_event, { id }) => {
  hiddenStickies.delete(id);
  const win = stickies.get(id);
  if (win && !win.isDestroyed()) win.close();
  return { pinned: [...stickies.keys()], hidden: [...hiddenStickies] };
});

ipcMain.handle("pet:hide", (_event, { id }) => {
  if (typeof id !== "string") return { pinned: [...stickies.keys()], hidden: [...hiddenStickies] };
  const win = stickies.get(id);
  if (win && !win.isDestroyed()) {
    win.hide();
    hiddenStickies.add(id);
    broadcastPinned();
  }
  return { pinned: [...stickies.keys()], hidden: [...hiddenStickies] };
});

ipcMain.handle("pet:show-sticky", (_event, { id }) => {
  if (typeof id !== "string") return { pinned: [...stickies.keys()], hidden: [...hiddenStickies] };
  const win = stickies.get(id);
  if (win && !win.isDestroyed()) {
    win.show();
    hiddenStickies.delete(id);
    broadcastPinned();
  }
  return { pinned: [...stickies.keys()], hidden: [...hiddenStickies] };
});

ipcMain.handle("pet:pinned", () => ({
  pinned: [...stickies.keys()],
  hidden: [...hiddenStickies],
}));

ipcMain.handle("pet:pin-all-top", () => {
  pinAllTop();
  return [...stickies.keys()];
});

ipcMain.handle("desk:show", () => {
  createMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle("pet:resize", (_event, { id, mode }) => {
  if (typeof id !== "string") return;
  const win = stickies.get(id);
  if (!win || win.isDestroyed()) return;
  const size = STICKY_SIZES[mode] ?? STICKY_SIZES.compact;
  const [x, y] = win.getPosition();
  const display = screen.getDisplayNearestPoint({ x, y });
  const area = display.workArea;
  const width = size.width;
  const height = size.height;
  const nx = Math.min(Math.max(x, area.x), area.x + area.width - width);
  const ny = Math.min(Math.max(y, area.y), area.y + area.height - height);
  win.setBounds({ x: Math.round(nx), y: Math.round(ny), width, height });
});

ipcMain.handle("dialog:openDirectory", async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(parent ?? undefined, {
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled) return null;
  return filePaths[0] ?? null;
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    createMainWindow();
  });
}

function closeStickies() {
  for (const win of stickies.values()) {
    if (!win.isDestroyed()) win.destroy();
  }
  stickies.clear();
  hiddenStickies.clear();
}

app.whenReady().then(() => {
  if (!gotLock) return;
  createMainWindow();
  app.on("activate", () => {
    createMainWindow();
  });
});

app.on("before-quit", () => {
  closeStickies();
});

app.on("window-all-closed", () => {
  app.quit();
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    app.quit();
  });
}
