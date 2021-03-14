const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();

const query = parseQuery(window.location.search);

contextBridge.exposeInMainWorld('query', query);

contextBridge.exposeInMainWorld('store', {
  get(...args) {
    return store.get(...args);
  },
  set(...args) {
    return store.set(...args);
  },
  has(...args) {
    return store.has(...args);
  },
  delete(...args) {
    return store.delete(...args);
  }
});

contextBridge.exposeInMainWorld(
  'state', {
    project: query.empty === 'true' ? false : {},
    path: typeof query.path !== 'undefined' ? query.path : null
  }
);


function send(channel, ...data) {
  let syncChannels = ['isGitInstalled', 'log'];
  if (syncChannels.includes(channel)) {
    return ipcRenderer.sendSync(channel, ...data);
  }

  let asyncChannels = ['openDialog', 'newProjectWindow'];
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
    fs: {
      exists: (path) => fs.existsSync(path)
    },
    send, receive,
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