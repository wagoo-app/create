const { app, BrowserWindow, dialog } = require("electron"); // Ajout de 'dialog'
const { autoUpdater } = require("electron-updater");
const path = require("path");
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "assets", "logo.png"),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    debug: false, // Désactive le mode debug pour éviter les messages d'erreur liés à l'auto-updater
  });

  // mainWindow.webContents.openDevTools(); // Retire les '//' au début si tu as besoin de débugger

  mainWindow
    .loadURL("https://create.wagoo.app", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    .catch((err) => {
      console.error("Erreur lors du chargement de l'URL :", err);
    });

  // Injecte la version de l'application dans le titre de la page chargée
  mainWindow.webContents.on("did-finish-load", () => {
    try {
      const ver = app.getVersion();
      const script = `
        (function() {
          try {
            function appendVersion() {
              try {
                if (!document.title.includes(' - v')) {
                  document.title = document.title + ' - v${ver}';
                }
              } catch(e) { /* ignore */ }
            }
            appendVersion();

            // Observer pour suivre les changements du <title> (SPAs)
            var titleEl = document.querySelector('title');
            if (!titleEl) {
              titleEl = document.createElement('title');
              document.head.appendChild(titleEl);
            }
            var observer = new MutationObserver(function() { appendVersion(); });
            observer.observe(titleEl, { childList: true, characterData: true, subtree: true });

            // Surveiller les navigations SPA
            var wrap = function(fn) { return function() { var res = fn.apply(this, arguments); setTimeout(appendVersion, 50); return res; }; };
            if (history.pushState) history.pushState = wrap(history.pushState);
            if (history.replaceState) history.replaceState = wrap(history.replaceState);
            window.addEventListener('popstate', appendVersion);
          } catch(e) { /* ignore */ }
        })();
      `;
      mainWindow.webContents.executeJavaScript(script).catch((e) => console.error('executeJavaScript error:', e));
    } catch (e) {
      console.error('Error appending version to title:', e);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Lance la recherche de mise à jour en arrière-plan
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    console.error("Erreur au lancement de l'updater :", error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ==========================================
// NOUVEAU SYSTÈME DE MISE À JOUR NON INTRUSIF
// ==========================================
autoUpdater.on("update-downloaded", () => {
  const dialogOpts = {
    type: "info",
    buttons: ["Mettre à jour maintenant", "Au prochain lancement"],
    title: "Mise à jour disponible",
    message: "Une nouvelle version de Wagoo a été téléchargée.",
    detail:
      "Voulez-vous redémarrer l'application pour l'installer maintenant ?",
  };

  dialog.showMessageBox(mainWindow, dialogOpts).then((returnValue) => {
    // returnValue.response contient l'index du bouton cliqué (0 ou 1)
    if (returnValue.response === 0) {
      // L'utilisateur a cliqué sur "Mettre à jour maintenant"
      // isSilent = false, isForceRunAfter = true
      autoUpdater.quitAndInstall(false, true);
    }
    // S'il clique sur "Au prochain lancement" (index 1), on ne fait rien.
    // L'updater a déjà stocké les fichiers, la mise à jour s'installera
    // automatiquement quand l'utilisateur fermera l'application normalement.
  });
});

autoUpdater.on("error", (err) => {
  console.error("Erreur de l'auto-updater :", err);
});
