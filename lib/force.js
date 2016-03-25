'use strict'

require('any-promise/register')('es6-promise')

var Initializer = require('./force/initializer')

class Force {
  /**
   * Create the Force class providing some options (such as grunt options)
   * @param {object} options - Some options see readme doc
   */
  constructor(options) {
    this.options = options || {
      // Set default options
      username: process.env.SF_USER,
      password: process.env.SF_PASSWORD,
      token: process.env.SF_TOKEN,
      host: process.env.SF_HOST
    }

    this.rootDir = process.cwd();
  }

  /** Initalises a .force folder and relevant files / metadata */
  init() {
    new Initializer(this).init();
  }

  /** Pushes changes if any have occurred up to salesforce */
  push() {}

  /**
   * Pulls the full set of metadata from salesforce creating any files that
   * dont exist. It does not by default override changed files
   */
  pull() {}

  /**
   * Watches for changes and pushes any if they occur immediately up to salesforce
   * Has binding mode to allow for subscription as well in order to respond to
   * changes which occur directly in salesforce.
   */
  watch() {}
}

module.exports = Force;
