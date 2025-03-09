'use strict';

const Homey = require('homey');

module.exports = class StatemachineDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    // set current_state from store or default in case of a new device
    let current_state = this.getStoreValue('current_state');
    if (current_state === null) {
      current_state = 'default';
    }
    this.setCapabilityValue('current_state', current_state);

    // set current_mode from store or default in case of a new device
    let current_mode = this.getStoreValue('current_mode');
    if (current_mode === null) {
      current_mode = 'default';
    }
    this.setCapabilityValue('current_mode', current_mode);

    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) has been initialized`);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) has been added`);
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) settings where changed`);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) was renamed to ${name}`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) has been deleted`);
  }

  /**
   * setState changes the state of the device
   * @param {string} name of the new state
   */
  setState(new_state) {
    let current_state = this.getCapabilityValue('current_state');
    if (current_state === new_state) {
      return;
    }

    this.setCapabilityValue('current_state', new_state);
    this.setStoreValue('current_state', new_state);
    this.log(`State changed from ${current_state} to ${new_state}`);
  }

  /**
   * getAvailableStates returns the available states of the device
   * @returns {object[]} available states
   */
  getAvailableStates() {
    let list = this.getSetting('states').split(',');
    if (list.length == 0) {
      return [];
    }
    return list.map(element => ({ name: element.trim() }));
  }

  /**
   * addAvailableState checks if a state is already in the available states and adds it if not
   * @param {object} state
   */
  addAvailableState(state) {
    let list = this.getAvailableStates();
    if (list.find(element => element.name === state.name)) {
      return;
    }

    list.push(state.name);
    let settings = { states: list.join(', ') };
    this.setSettings(settings);
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) settings where changed: ${settings}`);
  }

  /**
   * setMode changes the mode of the device
   * @param {string} name of the new mode
   */
  setMode(new_mode) {
    let current_mode = this.getCapabilityValue('current_mode');
    if (current_mode === new_mode) {
      return;
    }

    this.setCapabilityValue('current_mode', new_mode);
    this.setStoreValue('current_mode', new_mode);
    this.log(`Mode changed from ${current_mode} to ${new_mode}`);
  }

  /**
   * getAvailableModes returns the available modes of the device
   * @returns {object[]} available modes
   */
  getAvailableModes() {
    let list = this.getSetting('modes').split(',');
    if (list.length == 0) {
      return [];
    }
    return list.map(element => ({ name: element.trim() }));
  }

  /**
   * addAvailableMode checks if a mode is already in the available modes and adds it if not
   * @param {object} mode
   */
  addAvailableMode(mode) {
    let list = this.getAvailableModes();
    if (list.find(element => element.name === mode.name)) {
      return;
    }

    list.push(mode.name);
    let settings = { modes: list.join(', ') };
    this.setSettings(settings);
    this.log(`${this.getName()} (${this.getData().id.substring(0, 8)}) settings where changed: ${settings}`);
  }
};
