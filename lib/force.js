'use strict'

var fs = require('fse-promise');
var logger = require('winston');
var util = require('./force/util');
var Api = require('./force/api');
var Project = require('./force/project');
var Package = require('./force/package');

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
      host: process.env.SF_HOST,
      apiVersion: 36.0,
      logLevel: 'debug'
    }

    this.project = new Project(this);
    this.package = new Package(this);
    this.api = new Api(this);

    // Set the log level
    this.setLogLevel(this.options.logLevel);
  }

  setLogLevel(level) {
    logger.level = level;
  }

  /** Initalises a .force folder and relevant files / metadata */
  init() {
    return this.project.init();
  }

  /** Pushes changes if any have occurred up to salesforce */
  push() {
    let host = this.options.host;
    let api = this.api;

    logger.log('info',`Pushing to ${host}`);

    let result = this.package.create();

    api.connect()
      .then(() => result.then(stream => api.deploy(stream)))
      .catch(err => logger.log('error','Push failed: ', err));
  }

  /**
   * Pulls the full set of metadata from salesforce creating any files that
   * dont exist. It does not by default override changed files
   */
  pull() {
    let host = this.options.host;
    let api = this.api;

    // Trigger the async js retrieve
    let result = this.package.js;

    logger.log('info',`Pulling from ${host}`);

    api.connect()
      .then(() => result.then(js => api.retrieve(js)))
      .then((result) => this.package.extract(result.zipFile))
      .catch(err => logger.log('error','Pull failed: ', err));
  }

  /**
   * Watches for changes and pushes any if they occur immediately up to salesforce
   * Has binding mode to allow for subscription as well in order to respond to
   * changes which occur directly in salesforce.
   */
  watch() {}
}

module.exports = Force;
