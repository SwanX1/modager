'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const pathModule = require('path');
const getTemplate = require('./getTemplate');

function send(channel, ...data) {
  let syncChannels = ['isGitInstalled', 'log'];
  if (syncChannels.includes(channel)) {
    return ipcRenderer.sendSync(channel, ...data);
  }

  let asyncChannels = ['openDialog', 'getMinecraftVersionList', 'getModLoaderVersionList', 'createProject', 'setQuery'];
  if (asyncChannels.includes(channel)) {
    ipcRenderer.send(channel, ...data);
    return new Promise((resolve, reject) => {
      ipcRenderer.once(channel, (event, ...args) => resolve(...args));
    });
  }
}

function receive(channel, callback) {
  let validChannels = [];
  if (validChannels.includes(channel)) {
    return ipcRenderer.on(channel, callback);
  }
}

function accessible(path) {
  if (fs.existsSync(path)) {
    try {
      fs.accessSync(path, fs.constants.W_OK, fs.constants.R_OK);
      return true;
    } catch (err) {
      return false;
    }
  } else {
    return accessible(pathModule.join(path, '..'));
  }
}

contextBridge.exposeInMainWorld(
  'api', {
    log: send.bind(send, 'log'),
    fs: {
      isDirectory: (path) => fs.lstatSync(path).isDirectory(),
      isDirectoryEmpty: (path) => fs.readdirSync(path).length === 0,
      exists: (path) => fs.existsSync(path),
      accessible
    },
    path: {
      join: (...paths) => pathModule.join(...paths)
    },
    homedir: pathModule.join(require('os').homedir(), 'modager'),
    getTemplate, send, receive,
  }
);