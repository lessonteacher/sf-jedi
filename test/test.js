'use strict'

// TODO Add actual tests
var Force = require('../index.js');

// Set options
let options = {
  pullOnInit: true,

  project: {
    respectLocalChanges: true
  },

  logging: {
    level: 'debug'
  }
}

// Create object
let force = new Force(options);

// force.init();
force.pull();
// force.push();
// force.reset();
//
// force.reset()
//   .then(() => force.init())
//   .then(() => force.pull());
