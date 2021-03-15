'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs/promises');
const mc = require('aio-mc-api');
const store = new (require('electron-store'))();

const ipc = {
  on(channel, callback) {
    ipcMain.on(channel, (event, ...args) => {
      event.returnValue = callback(...args);
    });
  },
  onAsync(channel, callback) {
    ipcMain.on(channel, async (event, ...args) => {
      event.sender.send(channel, await callback(...args));
    });
  }
};

ipc.on('store', (action, ...params) => {
  switch (action) {
    case 'get':
      return store.get(...params);
    case 'set':
      return store.set(...params);
    case 'delete':
      return store.delete(...params);
    case 'has':
      return store.has(...params);
    default:
      throw new TypeError('No action for \'store\':', action);
  }
});

let gitInstalled = null;
ipc.on('isGitInstalled', () => {
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

ipc.on('log', console.log);

ipc.onAsync('openDialog', async (options = { properties: ['openFile'] }) => {
  return await dialog.showOpenDialog(options);
});

let minecraftVersionList;
ipc.onAsync('getMinecraftVersionList', async (...args) => {
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
ipc.onAsync('getModLoaderVersionList', async (...args) => {
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

ipc.onAsync('newProjectWindow', () => new Promise(resolve => {
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
  //window.webContents.openDevTools();
  window.once('ready-to-show', () => {
    window.show();
    resolve(true);
  });
}));

ipc.onAsync('setQuery', (query) => mainWin.loadURL('file://' + path.join(__dirname, '../html/index.html' + query)));

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

ipc.onAsync('createProject', /** @param {NewProjectData} data */ async data => {
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
    }
  }
  await fs.writeFile(path.join(data.path, 'pack.json'), JSON.stringify(projectManifest, null, 2));
  return data.path;
});

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
	//mainWin.webContents.openDevTools();
	mainWin.once('ready-to-show', () => {
    console.log('\x1b[0m\x1b[94mINFO \x1b[0mWindow is ready to show');
		mainWin.show();
	});

	mainWin.on('closed', () => {
		app.quit();
	});
});