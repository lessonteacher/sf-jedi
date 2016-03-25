'use strict'

var xml2js = require('xml2js');
var fs = require('fse-promise');
var Initializer = require('./force/initializer')
var ChangeLog = require('./force/change-log')

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

    // this.rootDir = process.cwd();
  }

  /** Initalises a .force folder and relevant files / metadata */
  init() {
    new Initializer(this).init();
  }

  /** Pushes changes if any have occurred up to salesforce */
  push() {console.log(`pushing...`)}

  /**
   * Pulls the full set of metadata from salesforce creating any files that
   * dont exist. It does not by default override changed files
   */
  pull() {
    let pkg = './.force/package/package.xml';

    fs.readFile(pkg,'utf-8').then(data => {
      xml2js.parseString(data, { explicitArray:false }, (err,dom) => {
        console.log(dom);
      })
    })
  }

  /**
   * Watches for changes and pushes any if they occur immediately up to salesforce
   * Has binding mode to allow for subscription as well in order to respond to
   * changes which occur directly in salesforce.
   */
  watch() {}
}

module.exports = Force;
