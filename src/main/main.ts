import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ClipboardManager } from "./clipboardManager.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardManager: ClipboardManager | null = null;
let isQuitting = false;

async function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    transparent: true,
    resizable: false,
    frame: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  if (!app.isPackaged) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    await win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  clipboardManager = new ClipboardManager(win);
  clipboardManager.start();
}

function createTray() {
  tray = new Tray(join(__dirname, "../../assets/iconTemplate.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Clipboard History",
      click: () => {
        win?.show();
        win?.webContents.send('navigate', 'history');
      },
    },
    {
      label: "Settings",
      click: () => {
        win?.show();
        win?.webContents.send('navigate', 'settings');
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Clipboard Manager");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    win?.isVisible() ? win?.hide() : win?.show();
  });
}

ipcMain.handle("get-clipboard-history", () => {
  return clipboardManager?.getHistory() || [];
});

ipcMain.handle("set-transparency", (_event, enabled: boolean) => {
  if (win) {
    // Note: Changing transparency dynamically requires recreating the window
    // For now, we'll just update the CSS class
    win.webContents.send('transparency-changed', enabled);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  if (!app.isPackaged) {
    win?.show();
  }
});

app.on("window-all-closed", () => {
  // Prevent app from quitting
});
