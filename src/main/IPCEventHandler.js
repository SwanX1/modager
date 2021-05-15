'use strict';

const { ipcMain } = require('electron');

/**
 * Utility class to easily listen and respond to IPC messages.
 */
class IPCEventHandler {
  /**
   * @param {string} channel 
   * @param {() => unknown} callback 
   * @returns {void}
   */
  sync(channel, callback) {
    ipcMain.on(channel, (event, ...args) => {
      event.returnValue = callback(...args);
    });
  }

  /**
   * @param {string} channel 
   * @param {() => Promise<unknown>} callback 
   * @returns {void}
   */
  async(channel, callback) {
    ipcMain.on(channel, async (event, ...args) => {
      event.sender.send(channel, await callback(...args));
    });
  }
};

module.exports = IPCEventHandler;