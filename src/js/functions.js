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