const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

/** @returns {string} */
function getDirname() {
  return ipcRenderer.sendSync('__dirname');
}

/** @type {Map<string, string>} */
const templateCache = new Map();
function getTemplate(name, variables = {}) {
  if (!templateCache.has(name)) {
    templateCache.set(name, fs.readFileSync(path.join(getDirname(), '../templates', name + '.html')).toString());
  }

  /** @type {string} */
  let template = templateCache.get(name)
    .replace(/\<\!\-\-.*\-\-\>/gi, ''); // Remove all comments 
  for (const key in variables) {
    if (Object.hasOwnProperty.call(variables, key)) {
      // Checks for {{key}} and replaces it with the according string.
      template = template.replaceAll(`{{${key}}}`, variables[key]);
    }
  }

  return template;
}

module.exports = getTemplate;