'use strict';

const Homey = require('homey');

module.exports = class Statemachine extends Homey.App {
  // stores data of each statemachine
  statemachines = [];
  states = [];
  events = [];

  // action cards
  actionChangeState = this.homey.flow.getActionCard('change-state');
  actionEmitEvent = this.homey.flow.getActionCard('emit-event');

  // trigger cards
  triggerStateChanged = this.homey.flow.getTriggerCard('state-has-changed');
  triggerStateChangedMode = this.homey.flow.getTriggerCard('state-has-changed-in-mode');
  triggerEventReceived = this.homey.flow.getTriggerCard('event-was-received');
  triggerEventReceivedMode = this.homey.flow.getTriggerCard('event-was-received-in-mode');

  // condition cards
  conditionState = this.homey.flow.getConditionCard('check-state');
  conditionEvent = this.homey.flow.getConditionCard('check-event');

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    // try {
    //   this.homey.settings.unset('statemachines');
    //   this.homey.settings.unset('states');
    //   this.homey.settings.unset('events');
    // } catch (error) {
    //   this.error(error)
    // }
    await this.initData();
    await this.initCards();

    this.log('Statemachine has been initialized');
  }

  async initData() {
    this.statemachines = await this.homey.settings.get('statemachines');
    if (this.statemachines == null) { this.statemachines = [] }

    this.states = await this.homey.settings.get('states');
    if (this.states == null) { this.states = [] }

    this.events = await this.homey.settings.get('events');
    if (this.events == null) { this.events = [] }
  }

  async initCards() {
    const autocompleteListenerStatemachine = async (query) => {
      const newStatemachine = {
        name: query,
        description: 'New',
        state: 'undefined'
      };

      if (this.statemachines.length < 1) {
        return [newStatemachine];
      }

      let list = this.statemachines.filter((element) => {
        return element.name.toLowerCase().includes(query.toLowerCase());
      });

      // TODO: Somehow it still adds the query even if it exists in this.data
      if (query != '' && !list.find((element) => element.name.toLowerCase() == query.toLowerCase)) {
        list.push(newStatemachine);
      }

      return list;
    }

    const autocompleteListenerState = async (query, args) => {
      const newState = {
        name: query,
        description: 'New'
      };

      // choose a statemachine first
      if (args.statemachine == 'undefined') {
        return [];
      }

      let statemachine = this.statemachines.find((element) => element.name == args.statemachine.name);
      if (statemachine == undefined) {
        return [];
      }

      // select state or create new one
      let list = this.states.filter((element) => {
        return element.statemachine == args.statemachine.name && element.name.toLowerCase().includes(query.toLowerCase());
      });

      if (query != '' && !list.find((element) => element.name.toLowerCase() == query.toLowerCase())) {
        newState['statemachine'] = args.statemachine.name;
        list.push(newState);
      }

      return list;
    };

    const autocompleteListenerEvent = async (query, args) => {
      const newEvent = {
        name: query,
        description: 'New'
      };

      // choose a statemachine first
      if (args.statemachine == 'undefined') {
        return [];
      }

      let statemachine = this.statemachines.find((element) => element.name == args.statemachine.name);
      if (statemachine == undefined) {
        return [];
      }

      // select event or create new one
      let list = this.events.filter((element) => {
        return element.statemachine == args.statemachine.name && element.name.toLowerCase().includes(query.toLowerCase());
      });

      if (query != '' && !list.find((element) => element.name.toLowerCase() == query.toLowerCase())) {
        newEvent['statemachine'] = args.statemachine.name;
        list.push(newEvent);
      }

      return list;
    };

    const save = (values) => {
      values.forEach((element) => {
        if (element.hasOwnProperty('statemachine')) {
          delete element.statemachine.description;
          if (!this.statemachines.find((fsm) => fsm.name == element.statemachine.name)) {
            this.statemachines.push(element.statemachine);
          }
        }
        if (element.hasOwnProperty('state')) {
          element.state['description'] = `Statemachine: ${element.state.statemachine}`;
          if (!this.states.find((state) => state.name == element.state.name && state.statemachine == element.state.statemachine)) {
            this.states.push(element.state);
          }
        }
        if (element.hasOwnProperty('event')) {
          element.event['description'] = `Statemachine: ${element.event.statemachine}`;
          if (!this.events.find((event) => event.name == element.event.name && event.statemachine == element.event.statemachine)) {
            this.events.push(element.event);
          }
        }
      })
      /*
      this.log('Saved Statemachines: ', this.statemachines);
      this.log('Saved States: ', this.states);
      */
      this.homey.settings.set('statemachines', this.statemachines);
      this.homey.settings.set('states', this.states);
      this.homey.settings.set('events', this.events);
    };

    /**
     * initialize ActionCards
     */

    this.actionChangeState.registerArgumentAutocompleteListener('statemachine', autocompleteListenerStatemachine);
    this.actionChangeState.registerArgumentAutocompleteListener('state', autocompleteListenerState);
    this.actionChangeState.registerRunListener(async (args) => {
      const tokens = { state: args.state.name };
      const state = { statemachine: args.statemachine.name };

      // check if state has changed
      let thisFSM = await this.getStatemachine(state.statemachine);
      if (thisFSM.state == tokens.state) {
        this.log(`[actionChangeState] [${args.statemachine.name}|${args.state.name}] State ${thisFSM.state} is the same`)
        return;
      }

      // save new state
      this.statemachines.forEach((element, index, array) => {
        if (element.name === state.statemachine) { array[index] = { name: element.name, state: tokens.state }; }
      });
      this.homey.settings.set('statemachines', this.statemachines);
      // this.log('[debug]', this.statemachines);

      // trigger related cards
      this.triggerStateChanged.trigger(tokens, state)
        .then(this.log(`[actionChangeState] [${args.statemachine.name}|${args.state.name}] Change state of ${state.statemachine} to ${tokens.state}`))
        .catch(this.error);
    });
    this.actionChangeState.on('update', () => {
      this.actionChangeState.getArgumentValues().then((values) => {
        save(values);
      });
    });

    this.actionEmitEvent.registerArgumentAutocompleteListener('statemachine', autocompleteListenerStatemachine);
    this.actionEmitEvent.registerArgumentAutocompleteListener('event', autocompleteListenerEvent);
    this.actionEmitEvent.registerRunListener(async (args) => {
      const tokens = { event: args.event.name };
      const state = { statemachine: args.statemachine.name };

      this.triggerEventReceived.trigger(tokens, state)
        .then(this.log(`[actionEmitEvent] Event ${tokens.event} emitted for ${state.statemachine}`))
        .catch(this.error);
    });
    this.actionEmitEvent.on('update', () => {
      this.actionEmitEvent.getArgumentValues().then((values) => {
        save(values);
      });
    });

    /**
     * initialize TriggerCards
     */

    this.triggerStateChanged.registerArgumentAutocompleteListener('statemachine', autocompleteListenerStatemachine);
    this.triggerStateChanged.registerRunListener(async (args, state) => {
      // this.log('[triggerStateChanged] args: ', args);
      // this.log('[triggerStateChanged] state: ', state);

      // check reference to statemachine
      if (args.statemachine.name != state.statemachine) {
        this.log(`[triggerStateChanged] [${args.statemachine.name}] Statemachine does not match`);
        return false;
      };

      this.log(`[triggerStateChanged] [${args.statemachine.name}] State of ${args.statemachine.name} changed to ${args.state.name}`);
      return true;
    });
    this.triggerStateChanged.on('update', () => {
      this.triggerStateChanged.getArgumentValues().then((values) => {
        save(values);
      });
    });

    this.triggerEventReceived.registerArgumentAutocompleteListener('statemachine', autocompleteListenerStatemachine);
    this.triggerEventReceived.registerArgumentAutocompleteListener('state', autocompleteListenerState);
    this.triggerEventReceived.registerRunListener(async (args, state) => {
      // this.log('[triggerEventReceived] args: ', args);
      // this.log('[triggerEventReceived] state: ', state);

      // check reference to statemachine
      if (args.statemachine.name != state.statemachine) {
        this.log(`[triggerEventReceived] [${args.statemachine.name}|${args.state.name}] Statemachine does not match`);
        return false;
      };

      // check if statemachine is in correct state
      let thisFSM = await this.getStatemachine(args.statemachine.name);
      if (thisFSM.state != args.state.name) {
        this.log(`[triggerEventReceived] [${args.statemachine.name}|${args.state.name}] State does not match`);
        return false;
      }

      this.log(`[triggerEventReceived] [${args.statemachine.name}|${args.state.name}] Event received for ${args.statemachine.name}`);
      return true;
    });
    this.triggerEventReceived.on('update', () => {
      this.triggerEventReceived.getArgumentValues().then((values) => {
        save(values);
      });
    });

    /**
     * initialize ConditionCards
     */

    this.conditionState.registerArgumentAutocompleteListener('state', (query) => {
      return this.states.filter((element) => {
        return element.name.toLowerCase().includes(query.toLowerCase())
      });
    });
    this.conditionState.registerRunListener((args) => {
      if (args.state.name != args.droptoken) {
        return false;
      }

      this.log(`[conditionState] State ${args.droptoken} matches condition ${args.state.name}`);
      return true
    });

    this.conditionEvent.registerArgumentAutocompleteListener('event', (query) => {
      return this.events.filter((element) => {
        return element.name.toLowerCase().includes(query.toLowerCase())
      });
    });
    this.conditionEvent.registerRunListener((args) => {
      if (args.event.name != args.droptoken) {
        return false;
      }

      this.log(`[conditionEvent] Event ${args.droptoken} matches condition ${args.event.name}`);
      return true
    });
  }

  async getStatemachine(name) {
    return this.statemachines.find((element) => element.name == name);
  }
};
