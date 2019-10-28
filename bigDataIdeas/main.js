const electron    = require("electron")
const child_process = require('child_process');
const dialog      = electron.dialog
const ipcMain     = electron.ipcMain

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 680, height: 600, minWidth: 680, minHeight: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on("main-process", function(event, args) {
  if (!args.message) {
    return;
  }

  switch (args.message) {
    case "import-files":
      dialog.showOpenDialog(
        {properties: ["openFile"]},
        function(filenames) {
          event.sender.send(
            "import-files-reply",
            {response: filenames ? filenames[0] : null}
          );
        }
      );
      break;
    case "save-file":
      const options = {
        title: "Export csv file"
      }
      dialog.showSaveDialog(options, function (filename) {
        event.sender.send(
          "save-file-reply",
          {response: filename}
        );
      })
      break;
  }
});
