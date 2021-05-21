'use strict';

class Setting {
  /**
   * @param {string} name
   * @param {string} text
   * @param {'boolean'} type
   */
  constructor(name, text, type) {
    this.name = name;
    this.text = text;
    this.type = type;

    this.label = document.createElement('label');
    this.label.classList.add('setting');
    this.input = document.createElement('input');
    if (this.type === 'boolean') {
      this.label.classList.add('form-switch');
      this.input.type = 'checkbox';
      this.input.id = this.name;
    }
    this.label.appendChild(this.input);
    const icon = document.createElement('i');
    icon.classList.add('form-icon');
    this.label.appendChild(icon);
    this.label.innerHTML += this.text;
  }

  /** @returns {HTMLInputElement} */
  getHtml() {
    return this.label;
  }

  setValue(value) {
    api.send('store', 'set', this.name, value);
    if (this.type === 'boolean') {
      this.input.checked = value;
    }
  }
  
  getValue() {
    return api.send('store', 'get', this.name);
  }
}

/** @type {Setting[]} */
const settings = [
  new Setting('showDevTools', 'Show DevTools', 'boolean'),
];

window.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const headerWrapper = document.querySelector('#header-wrapper');
  /** @type {HTMLDivElement} */
  const main = document.querySelector('#main');

  for (const setting of settings) {
    main.appendChild(setting.getHtml());
    
    //#region
    // Yes, I have to do this fuckery.
    // No, I did not want to do it.
    // Blame JS for being fucky for not
    // allowing setting.input.addEventListener to work.
    /** @type {HTMLInputElement} */
    const settingInput = document.querySelector('#' + setting.input.id);
    if (setting.type === 'boolean') {
      settingInput.checked = setting.getValue();
      settingInput.addEventListener('change', () => {
        setting.setValue(settingInput.checked);
      });
    }
    //#endregion
  }

  headerWrapper.innerHTML = api.getTemplate('headerbar', { title: 'Settings' });
});