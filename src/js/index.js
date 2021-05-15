import {
  toggleVisibility,
  hideMenu,
  addToast,
  validateManifest
} from './functions.js';

/** @type {import('aio-mc-api')} */
api.mc;

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
 * @typedef Project
 * @property {ProjectManifest} manifest
 * @property {string} path
 */

/**
 * @typedef ProjectManifest
 * @property {string} name Name of the project
 * @property {string} author Author of the project
 * @property {string?} icon
 * @property {Object} minecraft
 * @property {string} minecraft.version Version of Minecraft
 * @property {Object} minecraft.modloader
 * @property {'forge'} minecraft.modloader.name Name of the modloader (currently only forge is supported)
 * @property {string} minecraft.modloader.version Version of the modloader
 * @property {Mod[]} mods 
 */

/**
 * @typedef Mod
 * @property {number} id Project ID of the mod
 * @property {string} name Name of the mod
 * @property {Author[]} authors Authors of the mod
 * @property {string} websiteUrl URL for the mod
 * @property {Category[]} categories Categories for the mod
 * @property {number} primaryCategoryId Primary category id of the mod
 * @property {string} slug Mod slug
 * @property {string} iconUrl Icon URL for the mod
 * @property {number} installedFileId
 * @property {string} summary
 */

/**
 * @typedef Author
 * @property {string} name
 * @property {string} url Curseforge link to author's page
 * @property {number} id
 */

/**
 * @typedef Category
 * @property {number} categoryId
 * @property {string} name
 * @property {string} url
 * @property {string} avatarUrl
 * @property {number} parentId
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
      api.log('\x1b[0m\x1b[94mINFO \x1b[0mLoading project:', query.path);
      project.manifest = JSON.parse(api.fs.read(api.path.join(query.path, 'pack.json')));
      validateManifest(project.manifest);
      // Request versions from api before DOMContentLoaded for efficiency
      const getMinecraftVersionListPromise = api.send('getMinecraftVersionList');
      const getModLoaderVersionListPromise = api.send('getModLoaderVersionList');
      document.addEventListener('DOMContentLoaded', async () => {
        /** @type {HTMLProgressElement} */
        const loadingBar = document.querySelector('#loadingBar');
        /** @type {HTMLDivElement} */
        const navbarTitleNode = document.querySelector('#navbar-title');
        /** @type {HTMLDivElement} */
        const modsDiv = document.querySelector('#mods');
        /** @type {HTMLDivElement} */
        const iconSelect = document.querySelector('#icon-select');
        /** @type {HTMLInputElement} */
        const projectName = document.querySelector('#project-name');
        /** @type {HTMLInputElement} */
        const projectAuthor = document.querySelector('#project-author');
        /** @type {HTMLSelectElement} */
        const projectMinecraftVersion = document.querySelector('#project-minecraft-version');
        /** @type {HTMLSelectElement} */
        const projectForgeVersion = document.querySelector('#project-forge-version');
        
        if (project.manifest.icon) {
          iconSelect.setAttribute('style', `background-image: url("${'file://' + api.path.join(project.path, project.manifest.icon)}")`);
        } else {
          iconSelect.setAttribute('style', `background-image: url("${'file://' + api.path.join(api.send('__dirname'), '../images/icon_placeholder.png')}")`);
        }
        projectName.value = project.manifest.name;
        projectAuthor.value = project.manifest.author;

        const versions = await getMinecraftVersionListPromise;
        projectMinecraftVersion.innerHTML = versions.reduce((string, version) => string + `<option>${version.versionString}</option>`, '');
        projectMinecraftVersion.selectedIndex = versions.map(e => e.versionString).indexOf(project.manifest.minecraft.version);

        async function loaderVersionSelectLoad() {
          const loaderVersions = (await getModLoaderVersionListPromise)
            .filter(loaderVersion => loaderVersion.gameVersion === versions[projectMinecraftVersion.selectedIndex].versionString)
            .sort((a, b) => {
              // Sort Forge versions correctly (CurseForge provides them in incorrect order)
              const aS = a.name.split('.');
              const bS = b.name.split('.');

              const a1 = Number(aS[aS.length - 2]);
              const b1 = Number(bS[bS.length - 2]);
              const sort = b1 - a1;
              if (sort === 0) {
                const a2 = Number(aS[aS.length - 1]);
                const b2 = Number(bS[bS.length - 1]);
                return b2 - a2;
              } else {
                return sort;
              }
            });
          projectForgeVersion.innerHTML = loaderVersions.reduce((string, version) => string + `<option>${version.name.replace('forge-', '')}</option>`, '');
          projectForgeVersion.selectedIndex = loaderVersions.map(e => e.name.replace('forge-', '')).indexOf(project.manifest.minecraft.modloader.version);
        }

        projectMinecraftVersion.addEventListener('input', loaderVersionSelectLoad);
        await loaderVersionSelectLoad();

        iconSelect.addEventListener('click', async () => {
          const selection = await api.send('openDialog', {
            title: 'Select Project Icon',
            filters: [
              { name: 'PNG Images', extensions: ['png'] }
            ],
            properties: ['openFile']
          });
          if (selection.canceled) return;
          const oldIconPath = selection.filePaths[0];
          const newIconPath = api.path.join(project.path, api.path.filename(oldIconPath));
          api.fs.copy(oldIconPath, newIconPath);
          project.manifest.icon = api.path.relative(project.path, newIconPath);
          loadingBar.classList.remove('hidden');
          api.fs.write(api.path.join(project.path, 'pack.json'), JSON.stringify(project.manifest, null, 2));
          iconSelect.setAttribute('style', `background-image: url("${'file://' + newIconPath}")`);
          loadingBar.classList.add('hidden');
        });

        projectName.addEventListener('change', () => {
          project.manifest.name = projectName.value;
          loadingBar.classList.remove('hidden');
          api.fs.write(api.path.join(project.path, 'pack.json'), JSON.stringify(project.manifest, null, 2));
          loadingBar.classList.add('hidden');
        });

        projectAuthor.addEventListener('change', () => {
          project.manifest.author = projectAuthor.value;
          loadingBar.classList.remove('hidden');
          api.fs.write(api.path.join(project.path, 'pack.json'), JSON.stringify(project.manifest, null, 2));
          loadingBar.classList.add('hidden');
        });

        projectMinecraftVersion.addEventListener('input', () => {
          project.manifest.minecraft.version = projectMinecraftVersion.value;
          loadingBar.classList.remove('hidden');
          api.fs.write(api.path.join(project.path, 'pack.json'), JSON.stringify(project.manifest, null, 2));
          loadingBar.classList.add('hidden');
        });

        projectForgeVersion.addEventListener('input', () => {
          project.manifest.minecraft.modloader.version = projectForgeVersion.value;
          loadingBar.classList.remove('hidden');
          api.fs.write(api.path.join(project.path, 'pack.json'), JSON.stringify(project.manifest, null, 2));
          loadingBar.classList.add('hidden');
        });
        
        if (project.manifest.mods.length === 0) {
          modsDiv.innerHTML += api.getTemplate('emptymods');
        } else {
          project.manifest.mods.forEach(mod => {
            modsDiv.innerHTML += api.getTemplate('modtile', {
              iconUrl: mod.iconUrl,
              name: mod.name,
              authors: mod.authors.map(a => a.name).join(', '),
              summary: mod.summary,
              id: mod.id,
            });
          });
        }
        navbarTitleNode.innerHTML = project.manifest.name;
      });
    } catch (err) {
      document.addEventListener('DOMContentLoaded', () => {
        /** @type {HTMLDivElement} */
        const navbarTitleNode = document.querySelector('#navbar-title');
        navbarTitleNode.innerHTML = project.path;
        api.log('\x1b[0m\x1b[31mERROR \x1b[0mProject is not valid:', query.path);
        addToast('This path is not a project directory or the pack.json file is malformed.', 'error', { enabled: false });
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const mainNode = document.querySelector('#main');
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