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
}