# SF Jedi

This is a framework which abstracts the [JSforce][jsforce] metadata
`retrieve` and `deploy` functions. Essentially you can run a few commands
per the below example.

```javascript
'use strict'

// Require the module
var Force = require('sf-jedi');

// You MUST provide these 4. If you dont it will check the for env
// variables, SF_USERNAME, SF_PASSWORD, SF_TOKEN and SF_HOST
let options = {
  username: 'bill@amazingtown.com',
  password: 'somepassword',
  token: 'DSAddjsaddsadasda', // Annoying thing that salesforce sends you
  host: 'login.salesforce.com' // Or set some other domain
}

// Create the force object with the options
let force = new Force(options);

// Initialises a .force project folder
force.init();

// Pulls from from the org using some previously initialised setting
force.pull();

// Pushes the current src folder (or whatever you set it to) to the org
force.push();

// Obliterates the .force folder and whatever src folder, take care
force.reset();
```

Additionally you can set a number of options, if you take a look
at the example in the repo, but it looks basically like this.
**Note** that most of these are set for you and so are totally optional!

```javascript
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
    exitOnError: true
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
```

Primarily this is used at the moment in conjunction with
[`grunt-sf-jedi`][grunt-sf-jedi] which exposes these functions

## Planned Features

Clearly at the moment the project is fresh alpha, however, upcoming
features are the following (in probable order):

- Correct change tracking, push only locally changed files
- Watch task / function
- [Deleted] file tracking from git
- Destructive push / single truth source
- Command line interface

### What Token?

Just a free tip here, the salesforce 'token' trolled me a bit since it wasn't sent in any email automatically.
So, if you cant find the 'Reset My Security Token' option anywhere in 'Setup' try the following url.
Of course you will need to change to your domain for the url

```sh
https://<SalesforceDomainHere>/_ui/system/security/ResetApiTokenEdit?retURL=%2Fui%2Fsetup%2FSetup%3Fsetupid%3DPersonalInfo&setupid=ResetApiToken
```

Full credit to the guy in [this stackoverflow][stack] question.

## Acknowledgements

- [JSForce][jsforce] - I am using this to retrieve Salesforce data
- [jsforce-metadata-tools][meta-tools] - I used some of the logic for outputting results
- [grunt-sf-tooling][sf-tooling] - Never saw this till after i finished the first cut but props there its the same idea

[jsforce]:https://jsforce.github.io/
[grunt-sf-jedi]:https://github.com/lessonteacher/grunt-sf-jedi
[stack]:https://salesforce.stackexchange.com/questions/44483/salesforce-sandbox-security-token/74050#74050?newreg=d514d90eb89c4ca2b32da80fbfc86c77
[meta-tools]:https://github.com/jsforce/jsforce-metadata-tools/blob/master/lib/deploy.js
[sf-tooling]:https://www.npmjs.com/package/grunt-sf-tooling
