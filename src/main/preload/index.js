const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const mcapi = require('aio-mc-api');
const getTemplate = require('./getTemplate');

const query = parseQuery(window.location.search);

contextBridge.exposeInMainWorld('query', query);

function send(channel, ...data) {
  let syncChannels = ['isGitInstalled', 'log', 'store', '__dirname'];
  if (syncChannels.includes(channel)) {
    return ipcRenderer.sendSync(channel, ...data);
  }

  let asyncChannels = ['openDialog', 'newProjectWindow', 'newSettingsWindow', 'newAboutWindow', 'openExternal', 'getMinecraftVersionList', 'getModLoaderVersionList'];
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

contextBridge.exposeInMainWorld(
  'api', {
    log: send.bind(send, 'log'),
    path: {
      join: (...paths) => path.join(...paths),
      filename: (p) => path.basename(p),
      relative: (from, to) => path.relative(from, to)
    },
    fs: {
      exists: (path) => fs.existsSync(path),
      read: (path) => fs.readFileSync(path).toString(),
      write: (path, data) => fs.writeFileSync(path, data),
      copy: (src, dest) => fs.copyFileSync(src, dest)
    },
    getTemplate, send, receive, mc: mcapi
  }
);

/**
 * Parses querystring
 * @param {string} queryString window.location.search
 * @returns {object}
 */

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || true);
  }
  return query;
}
