'use strict';

const Homey = require('homey');
const uuid = require('uuid');

module.exports = class StatemachineDriver extends Homey.Driver {

  /**
   * Action cards
   */
  cardActionStateChange = this.homey.flow.getActionCard('state-change');

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.initActionCards();

    this.log('Statemachine has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      {
        name: 'New FSM',
        data: {
          id: uuid.v4(),
        },
      },
    ];
  }

  /**
   * initActionCards
   */
  initActionCards() {
    this.cardActionStateChange.registerArgumentAutocompleteListener('state', async (query, args) => {
      /*
      // create new state
      let new_state = {
        name: query,
        description: 'New'
      };

      // select state or add new_state
      let available_states = args.device.getAvailableStates();
      if (query !== '' && !available_states.find(element => element.name.toLowerCase() === query.toLowerCase())) {
        available_states.push(new_state);
      }

      return available_states;
      */
      return args.device.getAvailableStates();
    });
    this.cardActionStateChange.registerRunListener(async (args) => {;
      args.device.setState(args.state.name);
    });
  }

};
