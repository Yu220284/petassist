const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petassist", {
  isDesk: true,
  pin: (id) => ipcRenderer.invoke("pet:pin", { id }),
  unpin: (id) => ipcRenderer.invoke("pet:unpin", { id }),
  pinAllTop: () => ipcRenderer.invoke("pet:pin-all-top"),
  hideSticky: (id) => ipcRenderer.invoke("pet:hide", { id }),
  showSticky: (id) => ipcRenderer.invoke("pet:show-sticky", { id }),
  resizeSticky: (id, mode) => ipcRenderer.invoke("pet:resize", { id, mode }),
  pinned: () => ipcRenderer.invoke("pet:pinned"),
  showDock: () => ipcRenderer.invoke("desk:show"),
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  onPinned: (cb) => {
    const listener = (_event, payload) => {
      if (Array.isArray(payload)) cb({ pinned: payload, hidden: [] });
      else cb(payload ?? { pinned: [], hidden: [] });
    };
    ipcRenderer.on("pet:pinned-changed", listener);
    return () => ipcRenderer.removeListener("pet:pinned-changed", listener);
  },
});
