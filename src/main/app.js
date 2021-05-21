'use strict';

const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs/promises');
const mc = require('aio-mc-api');
const store = new (require('electron-store'))();
const IPCEventHandler = require('./IPCEventHandler');
const EventEmitter = require('events');

const eventbus = new EventEmitter();

if (!store.has('showDevTools')) {
  store.set('showDevTools', false);
}

const ipc = new IPCEventHandler();

ipc.sync('store', (action, ...params) => {
  eventbus.emit('store', action, ...params);
  switch (action) {
    case 'get':
      eventbus.emit('getStore', ...params);
      return store.get(...params);
    case 'set':
      eventbus.emit('setStore', ...params);
      return store.set(...params);
    case 'delete':
      eventbus.emit('deleteStore', ...params);
      return store.delete(...params);
    case 'has':
      eventbus.emit('hasStore', ...params);
      return store.has(...params);
    default:
      throw new TypeError('No action for \'store\':', action);
  }
});

ipc.async('openExternal', link => {
  return shell.openExternal(link);
});

let gitInstalled = null;
ipc.sync('isGitInstalled', () => {
  if (gitInstalled === null) {
    const gitVersion = spawnSync('git', ['--version']);
    console.log('\x1b[0m\x1b[90m$ git --version\x1b[0m');
    if (gitVersion.error) {
      console.log('\x1b[0m\x1b[33mWARN \x1b[0mGit is not installed.');
      gitInstalled = false;
    } else {
      console.log(gitVersion.stdout.toString().trim());
      gitInstalled = true;
    }
  }
  return gitInstalled;
});

ipc.sync('log', console.log);
ipc.sync('__dirname', () => __dirname);

ipc.async('openDialog', async (options = { properties: ['openFile'] }) => {
  return await dialog.showOpenDialog(options);
});

let minecraftVersionList;
ipc.async('getMinecraftVersionList', async (...args) => {
  if (!minecraftVersionList) {
    try {
      console.log('\x1b[0m\x1b[94mINFO \x1b[0mFetching minecraft versions');
      minecraftVersionList = await mc.curseforge.getMinecraftVersionList();
    } catch (err) {
      console.log('\x1b[0m\x1b[31mERROR \x1b[0mAn error occured when fetching minecraft versions:', err);
    }
  }
  return minecraftVersionList;
});

let modLoaderVersionList;
ipc.async('getModLoaderVersionList', async (...args) => {
  if (!modLoaderVersionList) {
    try {
      console.log('\x1b[0m\x1b[94mINFO \x1b[0mFetching modloader versions');
      modLoaderVersionList = await mc.curseforge.getModLoaderVersionList();
    } catch (err) {
      console.log('\x1b[0m\x1b[31mERROR \x1b[0mAn error occured when fetching modloader versions:', err);
    }
  }
  return modLoaderVersionList;
});

ipc.async('newProjectWindow', () => new Promise(resolve => {
  const window = new BrowserWindow({
    width: Math.min(480, mainWin.getSize()[0] - 64),
    height: Math.min(300, mainWin.getSize()[1] - 64),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, './preload/newproject.js')
    },
    backgroundColor: '#ffffff',
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    parent: mainWin,
    modal: true
  });
  window.loadURL('file://' + path.join(__dirname, '../html/newproject.html'));
  window.removeMenu();
  window.once('ready-to-show', () => {
    eventbus.emit('newWindow', window);
    window.show();
    resolve(true);
  });
}));

ipc.async('setQuery', (query) => mainWin.loadURL('file://' + path.join(__dirname, '../html/index.html' + query)));

/**
 * Data coming from a 'newproject' window, for project creation
 * @typedef {Object} NewProjectData
 * @property {string} name Name of the project
 * @property {string} author Author of the project
 * @property {string} path Directory to create the project in
 * @property {Object} version Contains version data for the project
 * @property {string} version.minecraft Minecraft version
 * @property {string} version.forge Modloader version
 * @property {boolean} initGit Should a new git repository be initialized in the given path? 
 */

ipc.async('createProject', /** @param {NewProjectData} data */ async data => {
  await fs.mkdir(data.path, { recursive: true });
  if (data.initGit) {
    console.log(`\x1b[0m\x1b[90m$ cd ${data.path}\x1b[0m`);
    console.log('\x1b[0m\x1b[90m$ git init\x1b[0m');
    const gitInit = spawnSync('git', ['init'], { cwd: data.path });
    if (gitInit.stderr.length !== 0) {
      console.log('\x1b[0m\x1b[31mINFO \x1b[0mGit Error:\n');
      console.log(gitInit.stderr.toString());
    }
  }
  const projectManifest = {
    name: data.name,
    author: data.author,
    minecraft: {
      version: data.version.minecraft,
      modloader: {
        name: 'forge',
        version: data.version.forge
      }
    },
    mods: []
  }
  await fs.writeFile(path.join(data.path, 'pack.json'), JSON.stringify(projectManifest, null, 2));
  return data.path;
});

ipc.async('newSettingsWindow', () => new Promise(resolve => {
  const window = new BrowserWindow({
    width: Math.min(480, mainWin.getSize()[0] - 64),
    height: Math.min(300, mainWin.getSize()[1] - 64),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, './preload/settings.js')
    },
    backgroundColor: '#ffffff',
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    parent: mainWin,
    modal: true
  });
  window.loadURL('file://' + path.join(__dirname, '../html/settings.html'));
  window.removeMenu();
  eventbus.emit('newWindow', window);
  window.once('ready-to-show', () => {
    window.show();
    resolve(true);
  });
}));
ipc.async('newAboutWindow', () => new Promise(resolve => {
  const window = new BrowserWindow({
    width: Math.min(480, mainWin.getSize()[0] - 64),
    height: Math.min(300, mainWin.getSize()[1] - 64),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, './preload/about.js')
    },
    backgroundColor: '#ffffff',
    show: false,
    resizable: true,
    autoHideMenuBar: true,
    frame: false,
    parent: mainWin,
    modal: true
  });
  window.loadURL('file://' + path.join(__dirname, '../html/about.html'));
  window.removeMenu();
  eventbus.emit('newWindow', window);
  window.once('ready-to-show', () => {
    window.show();
    resolve(true);
  });
}));

/** @type {BrowserWindow} */
let mainWin;
app.on('ready', () => {
  console.log('\x1b[0m\x1b[94mINFO \x1b[0mApp is ready, creating window...');
  mainWin = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, './preload/index.js')
    },
    resizable: true,
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true,
    frame: false
  });
  mainWin.loadURL('file://' + path.join(__dirname, '../html/index.html?init'));
  mainWin.removeMenu();
  eventbus.emit('newWindow', mainWin);
  mainWin.once('ready-to-show', () => {
    console.log('\x1b[0m\x1b[94mINFO \x1b[0mWindow is ready to show');
    mainWin.show();
  });

  mainWin.on('closed', () => {
    app.quit();
  });

  ipc.sync('minimize', () => {
    return mainWin.minimize();
  });

  ipc.sync('maximize', () => {
    if (mainWin.isMaximized()) {
      return mainWin.unmaximize();
    } else {
      return mainWin.maximize();
    }
  });
  
  ipc.sync('minimizable', () => {
    return mainWin.isMinimizable();
  });

  ipc.sync('maximizable', () => {
    return mainWin.isMaximizable();
  });
});

{ // Do not let this out in the global scope, no one _should_ access this.
  const allWindows = new Set();

  eventbus.on('newWindow', (window) => {
    if (store.get('showDevTools')) {
      window.webContents.openDevTools();
    }
    allWindows.add(window);
    window.on('closed', () => {
      allWindows.delete(window);
    });
  });

  eventbus.on('setStore', (...params) => {
    if (params[0] === 'showDevTools') {
      if (params[1] === true) {
        allWindows.forEach(window => window.webContents.openDevTools());
      } else if (params[1] === false) {
        allWindows.forEach(window => window.webContents.closeDevTools());
      }
    }
  });
}