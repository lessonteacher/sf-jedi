'use strict'

// Require the module
var Force = require('sf-jedi');

// Optionally create some options, the only ones you NEED to set are these
// first 4 connection related settings and they default to env variables
let options = {
  username: 'bill@amazingtown.com',
  password: 'somepassword',
  token: 'DSAddjsaddsadasda',   // Annoying thing that salesforce sends you
  host: 'login.salesforce.com', // Or set some other domain

  // apiVersion: '34.0', // Kind of not used but its available

  pollTimeout:60000, // Time in ms for jsforce retrieve / deploy
  pollInterval:1000, // Time between polls in ms for jsforce

  // Logging options
  logging: {
    level: 'debug', // For winston
  },

  // Project specific options
  project: {
    src: './src', // Where the files will go (do not leave a trailing /)
    pullOnInit: false, // Set this true if you want to pull after initialising
    createMetaXml: true, // True if you want missing -meta.xml to be created
    deleteSrcOnReset: true, // Set to false if you dont want the src folder to be reset

    // You can set the whole package.xml, this is the default(which is set for you)
    package: {
      types: [
        { members: '*', name: 'ApexClass' },
        { members: '*', name: 'ApexComponent' },
        { members: '*', name: 'ApexPage' },
        { members: '*', name: 'ApexTrigger' },
        { members: '*', name: 'StaticResource' }
      ],
      version: version || '34.0' // if you change THIS version it will be used
    }
  }
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
