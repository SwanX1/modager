import {
  toggleVisibility,
  hideMenu,
  addToast
} from './functions.js';

// Redirect initial window to last opened project (or an empty window if there is no last opened project)
if ('init' in query) {
  api.log('\x1b[0m\x1b[94mINFO \x1b[0mInitializing window...');
  if (api.send('store', 'has', 'lastPath')) {
    api.log('\x1b[0m\x1b[94mINFO \x1b[0mDetected last open project:', api.send('store', 'get', 'lastPath'));
    window.location.search = '?path=' + api.send('store', 'get', 'lastPath');
  } else {
    api.log('\x1b[0m\x1b[94mINFO \x1b[0mRedirecting to empty window');
    window.location.search = '?empty';
  }
}

if ('empty' in query) {
  api.send('store', 'delete', 'lastPath');
}

/**
 * @typedef ProjectManifest
 * @property {string} name Name of the project
 * @property {string} author Author of the project
 * @property {Object} minecraft
 * @property {string} minecraft.version Version of Minecraft
 * @property {Object} minecraft.modloader
 * @property {'forge'} minecraft.modloader.name Name of the modloader
 * @property {string} minecraft.modloader.version
 * @property {Mod[]} mods
 */

/**
 * @typedef Project
 * @property {ProjectManifest} manifest
 * @property {string} path
 */

/**
 * @type {Project}
 */
const project = {};
if ('path' in query) {
  if (!api.fs.exists(query.path)) {
    api.log('\x1b[0m\x1b[94mINFO \x1b[0mSpecified path does not exist, redirecting to empty window:', query.path);
    // Delete last opened project if the specified path doesn't exist, redirect to empty window
    if (api.send('store', 'get', 'lastPath') === query.path) {
      api.send('store', 'delete', 'lastPath');
    }
    window.location.search = '?empty';
  } else {
    // Store last opened project as current project
    api.send('store', 'set', 'lastPath', query.path);
    project.path = query.path;
    try {
      project.manifest = JSON.parse(api.fs.read(api.path.join(query.path, 'pack.json')));
      document.addEventListener('DOMContentLoaded', () => {
        /** @type {HTMLDivElement} */
        const navbarTitleNode = document.querySelector('#navbar-title');
        navbarTitleNode.innerHTML = project.manifest.name;
      });
    } catch (err) {
      document.addEventListener('DOMContentLoaded', () => {
        /** @type {HTMLDivElement} */
        const navbarTitleNode = document.querySelector('#navbar-title');
        navbarTitleNode.innerHTML = project.path;
        addToast('This directory doesn\'t look like a valid project...', 'error', { enabled: false });
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const mainNode = document.querySelector('#main');
  /** @type {HTMLProgressElement} */
  const loadingBar = document.querySelector('#loadingBar');
  /** @type {HTMLAnchorElement} */
  const menuCloseButton = document.querySelector('#menu-close');
  /** @type {HTMLAnchorElement} */
  const importButton = document.querySelector('#menu-import-btn');
  /** @type {HTMLAnchorElement} */
  const exportButton = document.querySelector('#menu-export-btn');
  /** @type {HTMLDivElement} */
  const importMenu = document.querySelector('#importmenu');
  /** @type {HTMLDivElement} */
  const exportMenu = document.querySelector('#exportmenu');
  if ('empty' in query) {
    menuCloseButton.parentElement.parentElement.removeChild(menuCloseButton.parentElement);
    mainNode.innerHTML = `
      <div class="empty">
        <p class="empty-title h5">You don't have a project open.</p>
        <p class="empty-subtitle">Click the Modager button on the top-left!</p>
      </div>
    `;
  } else if (!('init' in query)) {
    menuCloseButton.addEventListener('click', () => {
      hideMenu();
      api.log('\x1b[0m\x1b[94mINFO \x1b[0mClosing Project');
      window.location.search = '?empty';
    });
    importMenu.style.top = '156px';
    exportMenu.style.top = '192px';
  }

  if (!api.send('isGitInstalled')) {
    document.querySelector('#import-git').parentElement.classList.add('disabled');
  }

  document.querySelector('#modager-btn').addEventListener('click', () => {
    toggleVisibility(document.querySelector('#menu'));
    toggleVisibility(importMenu, true);
    toggleVisibility(exportMenu, true);
  });

  importButton.addEventListener('click', () => {
    toggleVisibility(importMenu);
    toggleVisibility(exportMenu, true);
  });

  exportButton.addEventListener('click', () => {
    toggleVisibility(importMenu, true);
    toggleVisibility(exportMenu);
  });

  document.querySelector('#menu-new').addEventListener('click', async () => {
    hideMenu();
    await api.send('newProjectWindow');
  });

  document.querySelector('#menu-open').addEventListener('click', async () => {
    hideMenu();
    const selection = await api.send('openDialog', {
      title: 'Select Project Directory',
      properties: ['openDirectory', 'createDirectory']
    });
    if (selection.canceled) {
      console.log('cancelled');
      return;
    }
    window.location.search = `?path=${selection.filePaths[0]}`;
  });

  document.querySelector('#menu-settings').addEventListener('click', async () => {
    hideMenu();
    await api.send('newSettingsWindow');
  });

  document.querySelector('#menu-about').addEventListener('click', async () => {
    hideMenu();
    await api.send('newAboutWindow');
  });

  // Hide menu if clicked outside it.
  // Hacky function, please rewrite it better if you can.
  document.addEventListener('click', event => {
    if (!document.querySelector('#menu').classList.contains('hidden')) {
      if (!event.path.some(e => 
        document.querySelector('#modager-btn') === e ||
        [...document.querySelectorAll('#modager-btn *')].some(child => e === child) ||
        [...document.querySelectorAll('#menu *')].some(child => e === child) ||
        [...document.querySelectorAll('#importmenu *')].some(child => e === child)
      )) {
        hideMenu();
      };
    }
  });

  mainNode.classList.remove('hidden');
});