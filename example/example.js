'use strict'

// Require the module
var Force = require('sf-jedi');

// Optionally create some options
let options = {
  username: 'bill@amazingtown.com',
  password: 'somepassword',
  token: 'DSAddjsaddsadasda', // Annoying thing that salesforce sends you
  host: 'login.salesforce.com' // Or set some other domain
}

// Create the force object with the options
let force = new Force(options);

// Initialises a .force project folder, and pulls from above org detail
force.init();

// Pulls from from the org using some previoously initialised setting
force.pull();

// Pushes the current src folder (or whatever you set it to) to the org
force.push();

// Obliterates the .force folder and whatever src folder, take care
force.reset();
