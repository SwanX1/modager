// Any JSDocs here are for code completion, they
// are not necessary, however please don't remove
// them as they help with development.
// Note to contributors:
//  Please, add your own JSDoc declarations if you can.

// Request versions from api before DOMContentLoaded for efficiency
const getMinecraftVersionListPromise = api.send('getMinecraftVersionList');
const getModLoaderVersionListPromise = api.send('getModLoaderVersionList');

const modifyProjectDirectoryValue = {
  modify: true,
  /** @type {string} */
  path: api.homedir
};

document.addEventListener('DOMContentLoaded', async () => {
  /** @type {HTMLDivElement} */
  const headerWrapper = document.querySelector('#header-wrapper');
  /** @type {HTMLProgressElement} */
  const loadingBar = document.querySelector('#loadingBar');
  /** @type {HTMLSelectElement} */
  const versionSelect = document.querySelector('#version');
  /** @type {HTMLSelectElement} */
  const loaderVersionSelect = document.querySelector('#loaderVersion')
  /** @type {HTMLInputElement} */
  const projectNameInput = document.querySelector('#projectName');
  /** @type {HTMLInputElement} */
  const projectAuthorInput = document.querySelector('#authorName');
  /** @type {HTMLInputElement} */
  const projectDirectoryInput = document.querySelector('#directorySelect');
  /** @type {HTMLAnchorElement} */
  const projectDirectoryInputButton = document.querySelector('#directorySelect-btn');
  /** @type {HTMLAnchorElement} */
  const projectDirectoryInputError = document.querySelector('#directorySelectError');
  /** @type {HTMLInputElement} */
  const gitCheckbox = document.querySelector('#initGit');
  /** @type {HTMLSpanElement} */
  const submitButton = document.querySelector('#submit');

  headerWrapper.innerHTML = api.getTemplate('headerbar', { title: 'New Project' });

  projectDirectoryInput.value = api.homedir;
  loadingBar.classList.remove('hidden');
  if (api.send('isGitInstalled')) {
    gitCheckbox.disabled = false;
  }
  const versions = await getMinecraftVersionListPromise;
  versionSelect.innerHTML = 
    versions.reduce(
      (string, version) => string + `<option>${version.versionString}</option>`,
      '<option selected disabled id="version-placeholder">Minecraft Version</option>'
    );
  loadingBar.classList.add('hidden');

  function removeLoaderVersionSelectPlaceholder() {
    loaderVersionSelect.removeChild(loaderVersionSelect.querySelector('#loaderVersion-placeholder'));
    loaderVersionSelect.removeEventListener('input', removeLoaderVersionSelectPlaceholder);
  }
  versionSelect.addEventListener('input', async () => {
    loadingBar.classList.remove('hidden');
    const loaderVersions = (await getModLoaderVersionListPromise)
      .filter(loaderVersion => loaderVersion.gameVersion === versions[versionSelect.selectedIndex].versionString)
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
    loaderVersionSelect.innerHTML =
      loaderVersions.reduce(
        (string, loaderVersion) => string + `<option>${loaderVersion.name.replace('forge-', '')}</option>`,
        '<option selected disabled id="loaderVersion-placeholder">Forge Version</option>'
      );
    // Remove to avoid two event listeners
    loaderVersionSelect.removeEventListener('input', removeLoaderVersionSelectPlaceholder);
    loaderVersionSelect.addEventListener('input', removeLoaderVersionSelectPlaceholder);
    loaderVersionSelect.disabled = false;
    if (loaderVersions.length === 0) {
      loaderVersionSelect.disabled = true;
      loaderVersionSelect.innerHTML = '<option selected>No Forge Versions</option>'
    }
    loaderVersionSelect.classList.remove('hidden');
    loadingBar.classList.add('hidden');
  });

  versionSelect.addEventListener('input', function removeVersionSelectPlaceholder() {
    versionSelect.removeChild(versionSelect.querySelector('#version-placeholder'));
    versionSelect.removeEventListener('input', removeVersionSelectPlaceholder);
  });

  projectNameInput.addEventListener('input', function nameUpdatesDirectory() {
    if (modifyProjectDirectoryValue.modify) {
      projectDirectoryInput.value = api.path.join(modifyProjectDirectoryValue.path, projectNameInput.value);
    } else {
      projectNameInput.removeEventListener('input', nameUpdatesDirectory);
    }
  });

  projectDirectoryInput.addEventListener('focusin', function removeNameUpdatesDirectory() {
    function innerRemoveTest() {
      modifyProjectDirectoryValue.modify = false;
    }
    projectDirectoryInput.addEventListener('input', innerRemoveTest);
    projectDirectoryInput.addEventListener('focusout', function failInnerRemoveTest() {
      projectDirectoryInput.removeEventListener('focusout', failInnerRemoveTest);
      projectDirectoryInput.removeEventListener('input', innerRemoveTest);
    });
  });

  projectDirectoryInputButton.addEventListener('click', async () => {
    const inputDir = document.forms['create-form'].directorySelect.value;
    const selection = await api.send('openDialog', {
      title: 'Select Project Directory',
      defaultPath: api.fs.exists(inputDir) ? inputDir : api.homedir,
      properties: ['openDirectory', 'createDirectory']
    });
    if (selection.canceled) return;
    modifyProjectDirectoryValue.modify = false;
    projectDirectoryInput.value = selection.filePaths[0];
  });

  submitButton.addEventListener('click', async function handleForm() {
    let error = false;
    /** @type {string} */
    let name = document.forms['create-form'].projectName.value;
    /** @type {string} */
    let author = document.forms['create-form'].authorName.value;
    /** @type {string} */
    let directory = document.forms['create-form'].directorySelect.value;
    /** @type {string} */
    let version = document.forms['create-form'].version.value;
    /** @type {string} */
    let loaderVersion = document.forms['create-form'].loaderVersion.value;
    /** @type {boolean} */
    let initGit = document.forms['create-form'].initGit.checked;
    
    let direrror = false;
    if (!api.fs.accessible(directory)) {
      projectDirectoryInputError.innerHTML = 'The provided path is not accessible.';
      direrror = true;
    } else if (api.fs.exists(directory)) {
      if (api.fs.isDirectory(directory)) {
        if (!api.fs.isDirectoryEmpty(directory)) {
          projectDirectoryInputError.innerHTML = 'The provided path is not empty.';
          direrror = true;
        }
      } else {
        projectDirectoryInputError.innerHTML = 'The provided path is not a directory.';
        direrror = true;
      }
    }
    if (direrror) {
      projectDirectoryInput.parentElement.parentElement.classList.add('has-error');
      function projectDirectoryRemoveError() {
        projectDirectoryInput.parentElement.parentElement.classList.remove('has-error');
        projectDirectoryInput.removeEventListener('input', projectDirectoryRemoveError);
        projectDirectoryInputButton.removeEventListener('click', projectDirectoryRemoveError);
        if (modifyProjectDirectoryValue.modify) {
          projectNameInput.removeEventListener('input', projectDirectoryRemoveError);
        }
      }
      projectDirectoryInput.addEventListener('input', projectDirectoryRemoveError);
      projectDirectoryInputButton.addEventListener('click', projectDirectoryRemoveError);
      if (modifyProjectDirectoryValue.modify) {
        projectNameInput.addEventListener('input', projectDirectoryRemoveError);
      }
      error = true;
    }

    if (!(/^[a-z0-9\-\_\. ]+$/gi.test(name))) {
      projectNameInput.parentElement.parentElement.classList.add('has-error');
      projectNameInput.addEventListener('input', function projectNameRemoveError() {
        projectNameInput.parentElement.parentElement.classList.remove('has-error');
        projectNameInput.removeEventListener('input', projectNameRemoveError);
      });
      error = true;
    }

    if (!(/^[a-z0-9\-\_\. ]+$/gi.test(author))) {
      projectAuthorInput.parentElement.parentElement.classList.add('has-error');
      projectAuthorInput.addEventListener('input', function projectAuthorRemoveError() {
        projectAuthorInput.parentElement.parentElement.classList.remove('has-error');
        projectAuthorInput.removeEventListener('input', projectAuthorRemoveError);
      });
      error = true;
    }

    if (version === 'Minecraft Version') {
      versionSelect.parentElement.parentElement.classList.add('has-error');
      versionSelect.addEventListener('input', function versionRemoveError() {
        versionSelect.parentElement.parentElement.classList.remove('has-error');
        versionSelect.removeEventListener('input', versionRemoveError);
      });
      error = true;
    }

    if (loaderVersion === 'Forge Version') {
      loaderVersionSelect.parentElement.parentElement.classList.add('has-error');
      loaderVersionSelect.addEventListener('input', function loaderVersionRemoveError() {
        loaderVersionSelect.parentElement.parentElement.classList.remove('has-error');
        loaderVersionSelect.removeEventListener('input', loaderVersionRemoveError);
      });
      error = true;
    }
    if (error === false) {
      submitButton.removeEventListener('click', handleForm);
      projectNameInput.disabled = true;
      projectAuthorInput.disabled = true;
      versionSelect.disabled = true;
      loaderVersionSelect.disabled = true;
      projectDirectoryInput.disabled = true;
      projectDirectoryInputButton.setAttribute('disabled', true);
      gitCheckbox.disabled = true;
      submitButton.setAttribute('disabled', true);
      loadingBar.classList.remove('hidden');
      await api.send('createProject', {
        name, author, initGit,
        path: directory,
        version: {
          minecraft: version,
          forge: loaderVersion
        }
      });
      await api.send('setQuery', '?path=' + directory);
      loadingBar.classList.add('hidden');
      window.close();
    }
  });
});