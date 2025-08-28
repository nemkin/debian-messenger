const { app, session, BrowserWindow, Tray, Menu, Notification, shell } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      // Optional but recommended for consistent window.open behavior:
      nativeWindowOpen: true,
    },
  });

  const HOME_URL = 'https://www.messenger.com';
  mainWindow.loadURL(HOME_URL);
  mainWindow.setMenu(null);

  // 🔑 Block popups and open in default browser instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow in-app windows only for URLs you trust (Messenger auth flows, etc.)
    const allowed = new URL(url).hostname.endsWith('.messenger.com')
                  || new URL(url).hostname.endsWith('.facebook.com');

    if (allowed) return { action: 'allow' }; // keep login/auth dialogs if needed

    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Optional: prevent full navigations away from Messenger
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const host = new URL(url).hostname;
    const sameApp = host.endsWith('.messenger.com') || host.endsWith('.facebook.com');
    if (!sameApp) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Close → hide to tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
  // Permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(['notifications', 'media', 'mediaKeySystem'].includes(permission));
  });

  createMainWindow();

  // Tray
  const iconPath = path.join(__dirname, 'assets/icons/icon.png');
  tray = new Tray(iconPath);
  const trayMenu = Menu.buildFromTemplate([
    { label: 'Show Messenger', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(trayMenu);
  tray.setToolTip('Messenger');

  // Ready notification
  const notification = new Notification({
    title: 'Messenger',
    body: 'Messenger is ready!',
    icon: iconPath,
  });
  notification.on('click', () => mainWindow?.show());
  notification.show();
});

app.on('before-quit', () => { tray?.destroy(); app.isQuitting = true; });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && !mainWindow) {
    createMainWindow();
  }
});
