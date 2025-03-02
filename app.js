'use strict';

const Homey = require('homey');

module.exports = class Statemachine extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Statemachine has been initialized');
  }

};
