const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require('path'); 
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "assets", "icon.ico"), 
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Charge l'application Wagoo
  mainWindow.loadURL("https://create.wagoo.app", {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
}

app.whenReady().then(() => {
  createWindow();

  // Vérifie les mises à jour au démarrage
  autoUpdater.checkForUpdatesAndNotify();
});

// Quitte l'application quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Installe automatiquement la mise à jour une fois téléchargée
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});
