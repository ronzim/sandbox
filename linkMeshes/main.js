
/*jshint globalstrict: true*/
'use strict';

// Electron modules
var electron      = require('electron');
var app           = electron.app;  // Module to control application life.
var BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var dialog        = electron.dialog;
var ipcMain       = electron.ipcMain;
var Menu          = electron.Menu;
var shell         = electron.shell;
var Window        = require('electron-window');

console.log(electron)

// Node modules
var dir              = require('node-dir');
var path             = require('path');
var _                = require('underscore');

// Local modules
// var pjson = require('./package.json');

// -------------------
// Application windows
// -------------------
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var loadingWindow;
var authWindow;
var metadataWindows = {};

function createMainWindow(data) {
  // Create and show the browser window.
  mainWindow = Window.createWindow({
    width: 1200,
    height: 850,
    minWidth: 1200,
    minHeight: 850,
    show: false
  });
  var mainWindowPage = 'index.html';
  var mainWindowPath = path.join(__dirname, mainWindowPage);
  mainWindow.showUrl(mainWindowPath, data);

  // Open the DevTools
  // if (pjson.dev === true) {
    mainWindow.webContents.openDevTools();
  // }

  // Emitted when the window is going to be closed.
  // It's emitted before the beforeunload and unload event of the DOM.
  // Calling event.preventDefault() will cancel the close.
  mainWindow.on('close', function(event) {
    // Prevents the window from closing
    //event.preventDefault();

    // Send async message to renderer process
    //mainWindow.webContents.send('check-open-process');
  });

  // Emitted when the window is closed
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.once('show', function() {
    if (loadingWindow) {
      loadingWindow.close();
      loadingWindow = null;
    }
  });
}

// Listen for async message from renderer process
ipcMain.on('hide-app', function(event, arg) {
  // Hide window while killing open requests
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('close-app', function(event, arg) {
  // Close window, triggers close app
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
});

ipcMain.on('restart-app', function(event, arg) {
  createMainWindow({});

  // Close main window
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
});

// Chrome by default black lists certain GPUs because of bugs.
// if your are not able to view webgl try enabling --ignore-gpu-blacklist option
// But, this will make electron/chromium less stable.
app.commandLine.appendSwitch('ignore-gpu-blacklist');

// Enable forced garbage collection
app.commandLine.appendSwitch('js-flags', '--expose_gc');

// Quit when all windows are closed
app.on('window-all-closed', function() {
  // Close app
  app.quit();
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow({});
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  createMainWindow({});
});

// Emitted when failed to verify the certificate for url,
// to trust the certificate you should prevent the default behavior
// with event.preventDefault() and call callback(true).
app.on('certificate-error', function(event, webContents, url, error, certificate, callback) {
  // TODO
  // if (url === 'https://github.com') {
  //   // Verification logic.
  //   event.preventDefault()
  //   callback(true)
  // } else {
  //   callback(false)
  // }

  // Always validate certificate, this is the same of calling
  // app.commandLine.appendSwitch('--ignore-certificate-errors');
  event.preventDefault();
  callback(true);
});

// var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
//   // Someone tried to run a second instance, we should focus our window.
//   var currentWindow = loadingWindow || mainWindow;
//   if (currentWindow) {
//     if (currentWindow.isMinimized()) {
//       currentWindow.restore();
//     }
//     currentWindow.focus();
//   } else {
//     createMainWindow({});
//   }
// });

// Quit the second instance
// if (shouldQuit) {
//   app.quit();
// }

// Communication channel between loader and main window
ipcMain.on('app-ready', function(event, data) {
  createMainWindow(data);
});

// -----------------------
// Open OS folder selector
// -----------------------
var openFolderSelector = function(props, cb) {
  dialog.showOpenDialog(
    // On Windows and Linux an open dialog can not be both a file selector and a
    // directory selector, so if you set properties to ['openFile', 'openDirectory']
    // on these platforms, a directory selector will be shown.
    // {properties: ['openFile', 'openDirectory', 'multiSelections']},
    {properties: props},
    function(filenames) {
      cb(filenames);
    }
  );
};

// ----------------------------
// Import file request response
// ----------------------------
var importFiles = function(event, args) {
  openFolderSelector(['openDirectory'], function(folderpaths) {
    _.each(folderpaths, function(folderpath) {
      dir.files(folderpath, function(error, filepaths) {
        if (error) {
          console.error(error);
          return;
        }

        event.sender.send(
          'image-loader-replys',
          {
            message: 'import-files-reply',
            progressElmId: args.progressElmId,
            response: filepaths
          }
        );
      });
    });
  });
};

// ---------------------
// Web process listeners
// ---------------------
ipcMain.on('main-process', function(event, args) {
  if (!_.has(args, 'message') || (args.filepaths && args.filepaths.length === 0)) {
    return;
  }

  switch (args.message) {
    case 'import-files':
      importFiles(event, args);
      break;
  }
});
