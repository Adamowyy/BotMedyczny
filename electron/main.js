const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3000;
const IS_DEV = !app.isPackaged;

let mainWindow;
let serverProcess;

function startServer() {
  return new Promise((resolve) => {
    serverProcess = fork(path.join(__dirname, '..', 'server.js'), [], {
      env: { ...process.env, PORT },
      silent: true,
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[server] ${data}`);
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`[server] ${data}`);
    });

    const check = () => {
      http.get(`http://localhost:${PORT}/`, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 300);
      }).on('error', () => setTimeout(check, 300));
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    title: 'Asystent Medyczny',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = IS_DEV
    ? 'http://localhost:5173'
    : `http://localhost:${PORT}`;

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.on('win:minimize', () => mainWindow?.minimize());
  ipcMain.on('win:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('win:close', () => mainWindow?.close());
}

app.whenReady().then(async () => {
  if (!IS_DEV) {
    await startServer();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
