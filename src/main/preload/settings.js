const { contextBridge, ipcRenderer } = require('electron');

function send(channel, ...data) {
  let syncChannels = ['log', 'store'];
  if (syncChannels.includes(channel)) {
    return ipcRenderer.sendSync(channel, ...data);
  }

  let asyncChannels = ['openDialog'];
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
    send, receive,
  }
);