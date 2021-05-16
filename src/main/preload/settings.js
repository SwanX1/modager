const { contextBridge, ipcRenderer } = require('electron');
const getTemplate = require('./getTemplate');

function send(channel, ...data) {
  let syncChannels = ['store'];
  if (syncChannels.includes(channel)) {
    return ipcRenderer.sendSync(channel, ...data);
  }

  let asyncChannels = [];
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
  'api', { send, receive, getTemplate }
);