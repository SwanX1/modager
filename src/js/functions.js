'use strict';
/**
 * @param {HTMLElement} element
 * @returns {void}
 */
export function toggleVisibility(element, force) {
  element.classList.toggle('hidden', force);
}

/**
 * Hides #menu and #importmenu
 */
export function hideMenu() {
  toggleVisibility(document.querySelector('#menu'), true);
  toggleVisibility(document.querySelector('#importmenu'), true);
  toggleVisibility(document.querySelector('#exportmenu'), true);
}

/**
 * @param {string} text
 * @param {'primary'|'success'|'warning'|'error'} [type='warning']
 * @param {object} [dismiss]
 * @param {boolean} [dismiss.enabled=true]
 * @param {string} [dismiss.text='&times;']
 * 
 * @returns HTMLDivElement
 */
export function addToast(text, type = 'warning', dismiss = { enabled: true, text: '&times;' }) {
  let toastElement;
  let toastCode = `<p>${text}</p>`;
  if (dismiss.enabled == true) {
    toastCode = `<a onclick="this.parentNode.parentNode.removeChild(this.parentNode)" class="float-right noselect" style="text-decoration: none">${dismiss.text}</a>` + toastCode;
  }

  toastElement = document.createElement('div');
  toastElement.innerHTML = toastCode;
  toastElement.classList.add('toast');
  toastElement.classList.add(`toast-${type}`);
  return document.getElementById("toasts").appendChild(toastElement);
}

/**
 * Checks if given object is a valid project manifest.
 * @param {object} o
 * @returns {void}
 * @throws Will throw an error if the given object is not a valid project manifest.
 */
export function validateManifest(o) {
  if (typeof o.name !== 'string') throw new Error();
  if (typeof o.author !== 'string') throw new Error();
  if (typeof o.icon !== 'undefined' && typeof o.icon !== 'string') throw new Error();
  if (typeof o.minecraft !== 'object') throw new Error();
  if (typeof o.minecraft.version !== 'string') throw new Error();
  if (typeof o.minecraft.modloader !== 'object') throw new Error();
  if (o.minecraft.modloader.name !== 'forge') throw new Error();
  if (typeof o.minecraft.modloader.version !== 'string') throw new Error();
  if (!Array.isArray(o.mods)) throw new Error();
  
  o.mods.forEach(mod => {
    if (typeof mod.id !== 'number') throw new Error();
    if (typeof mod.name !== 'string') throw new Error();
    if (!Array.isArray(mod.authors)) throw new Error();
    if (typeof mod.websiteUrl !== 'string') throw new Error();
    if (!Array.isArray(mod.categories)) throw new Error();
    if (typeof mod.primaryCategoryId !== 'number') throw new Error();
    if (typeof mod.slug !== 'string') throw new Error();
    if (typeof mod.iconUrl !== 'string') throw new Error();
    if (typeof mod.installedFileId !== 'number') throw new Error();
    if (typeof mod.summary !== 'string') throw new Error();
    mod.authors.forEach(author => {
      if (typeof author.name !== 'string') throw new Error();
      if (typeof author.url !== 'string') throw new Error();
      if (typeof author.id !== 'number') throw new Error();
    });
    mod.categories.forEach(category => {
      if (typeof category.categoryId !== 'number') throw new Error();
      if (typeof category.name !== 'string') throw new Error();
      if (typeof category.url !== 'string') throw new Error();
      if (typeof category.avatarUrl !== 'string') throw new Error();
      if (typeof category.parentId !== 'number') throw new Error();
    });
  });
}