const { app, session, BrowserWindow, Tray, Menu, Notification } = require('electron');
const path = require('path');

let mainWindow;
let tray = null; // Tray instance

app.on('ready', () => {
  // Set permission request handler for notifications and media
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (['notifications', 'media', 'mediaKeySystem'].includes(permission)) {
      callback(true); // Allow permissions for notifications, microphone, and webcam
    } else {
      callback(false); // Deny other permissions
    }
  });

  // Create the main window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.loadURL('https://www.messenger.com');
  mainWindow.setMenu(null);

  // Create tray icon
  const iconPath = path.join(__dirname, 'assets/icons/icon.png');
  tray = new Tray(iconPath);

  // Tray menu
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show Messenger',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(trayMenu);
  tray.setToolTip('Messenger');

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault(); // Prevent window from closing
      mainWindow.hide(); // Minimize to tray
    }
  });

  // Ensure proper cleanup
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const notification = new Notification({
    title: 'Messenger',
    body: 'Messenger is ready!',
    icon: path.join(__dirname, 'assets/icons/icon.png'), // Use your icon path
  });
  notification.on('click', () => {
    mainWindow.show();
  });
  notification.show();
});

app.on('before-quit', () => {
  if (tray) tray.destroy();
  app.isQuitting = true; // Allow app to quit fully
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    // Prevent new windows and open URLs in the default browser instead
    require('electron').shell.openExternal(url);
  });

  contents.on('did-create-window', () => {
    contents.on('select-bluetooth-device', (event) => {
      event.preventDefault();
    });
  });

  contents.on('notification-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && !mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
        webSecurity: true,
      },
    });
    mainWindow.loadURL('https://www.messenger.com');
    mainWindow.setMenu(null);
  }
});
