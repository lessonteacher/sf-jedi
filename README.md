# SF Jedi

_**Note:** This project is currently in an alpha state, expect defects and
difficulties._

This is a framework which abstracts the [JSforce][jsforce] metadata
`retrieve` and `deploy` functions. Essentially you can run a few commands
per the below example.

```javascript
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

## Acknowledgements

- [JSForce][jsforce] - I am using this to retrieve Salesforce data

[jsforce]:https://jsforce.github.io/
[grunt-sf-jedi]:https://github.com/lessonteacher/grunt-sf-jedi
