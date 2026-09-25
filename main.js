const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, "icon.ico");
  const iconOptions = fs.existsSync(iconPath) ? { icon: iconPath } : {};

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Sabre Training Simulator - Wings Fly Aviation Academy",
    ...iconOptions,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: "#141a24",
    show: false
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Never hand untrusted schemes (for example file:, javascript:, or a
    // custom protocol) to the operating system.
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  const menuTemplate = [
    {
      label: "Simulator",
      submenu: [
        {
          label: "Reset Session",
          accelerator: "CmdOrCtrl+N",
          click: () => { mainWindow.webContents.executeJavaScript("sbResetSession()"); }
        },
        {
          label: "Load Lesson PNR (K7QZLM)",
          accelerator: "CmdOrCtrl+L",
          click: () => { mainWindow.webContents.executeJavaScript("sbLoadLessonPNR()"); }
        },
        { type: "separator" },
        { role: "quit", label: "Exit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "zoomin" },
        { role: "zoomout" },
        { role: "resetzoom" },
        { type: "separator" },
        {
          label: "Developer Tools",
          accelerator: "F12",
          click: () => mainWindow.webContents.openDevTools()
        }
      ]
    },
    {
      label: "GDS Commands",
      submenu: [
        {
          label: "Redisplay PNR (*R)",
          accelerator: "CmdOrCtrl+I",
          click: () => { mainWindow.webContents.executeJavaScript("sbEcho('*R'); sbParse('*R')"); }
        },
        {
          label: "Save and End (ER)",
          accelerator: "CmdOrCtrl+S",
          click: () => { mainWindow.webContents.executeJavaScript("sbEcho('ER'); sbParse('ER')"); }
        },
        {
          label: "Price Quote (WPNCB)",
          click: () => { mainWindow.webContents.executeJavaScript("sbEcho('WPNCB'); sbParse('WPNCB')"); }
        },
        {
          label: "Issue Ticket (WT)",
          click: () => { mainWindow.webContents.executeJavaScript("sbEcho('WT'); sbParse('WT')"); }
        }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Sabre Training Simulator",
              message: "Sabre GDS Training Simulator v1.0",
              detail: "Wings Fly Aviation Academy\nProfessional Sabre GDS training simulation.\n\nNot affiliated with Sabre Corporation.\nNo live GDS access - training environment only."
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
