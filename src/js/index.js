import {
  toggleVisibility,
  hideMenu
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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const mainNode = document.querySelector('#main');
  /** @type {HTMLDivElement} */
  const navbarPathNode = document.querySelector('#navbar-path');
  /** @type {HTMLProgressElement} */
  const loadingBar = document.querySelector('#loadingBar');
  /** @type {HTMLAnchorElement} */
  const menuCloseButton = document.querySelector('#menu-close');

  if ('empty' in query) {
    menuCloseButton.parentElement.parentElement.removeChild(menuCloseButton.parentElement);
    mainNode.innerHTML = `
      <div class="empty">
        <p class="empty-title h5">You don't have a project open.</p>
        <p class="empty-subtitle">Click the Modager button on the top-left!</p>
      </div>
    `;
  } else if (!('init' in query)) {
    navbarPathNode.innerHTML = query.path;
    menuCloseButton.addEventListener('click', () => {
      hideMenu();
      api.log('\x1b[0m\x1b[94mINFO \x1b[0mClosing Project');
      window.location.search = '?empty';
    });
  }

  if (!api.send('isGitInstalled')) {
    document.querySelector('#import-git').parentElement.classList.add('disabled');
  }

  document.querySelector('#modager-btn').addEventListener('click', () => {
    toggleVisibility(document.querySelector('#menu'));
    toggleVisibility(document.querySelector('#importmenu'), true);
  });

  document.querySelector('#menu-import-btn').addEventListener('click', () => {
    toggleVisibility(document.querySelector('#importmenu'));
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