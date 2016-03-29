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
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
      token: process.env.SF_TOKEN,
      host: process.env.SF_HOST,
      apiVersion: 36.0,
      logLevel: 'info'
    }

    if(!this._credentialsValid(this.options)) {
      throw `
      No valid credentials supplied. Set username, password and token as options or
      use .env file and package which will load that e.g. 'dotenv' to supply SF_USERNAME, SF_PASSWORD and
      SF_TOKEN
      `;
    }

    this.project = new Project(this);
    this.package = new Package(this);
    this.api = new Api(this);

    // Set the log level
    this.setLogLevel(this.options.logLevel);
  }

  _credentialsValid(options) {
    return (options.username && options.password && options.token)
  }

  setLogLevel(level) {
    logger.level = level;
  }

  /** Initalises a .force folder and relevant files / metadata */
  init() {
    return this.project.init()
      .then(() => logger.log('info',`Initialization done`));
  }

  /** Pushes changes if any have occurred up to salesforce */
  push() {
    let host = this.options.host;
    let api = this.api;

    logger.log('info',`Pushing to ${host}`);

    let result = this.package.create();

    return api.connect()
      .then(() => result.then(stream => api.deploy(stream)))
      .then(() => logger.log('info',`Push completed successfully`))
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

    return api.connect()
      .then(() => result.then(js => api.retrieve(js)))
      .then((result) => this.package.extract(result.zipFile))
      .then(() => logger.log('info',`Pull completed successfully`))
      .catch(err => logger.log('error','Pull failed: ', err));
  }

  /**
   * Watches for changes and pushes any if they occur immediately up to salesforce
   * Has binding mode to allow for subscription as well in order to respond to
   * changes which occur directly in salesforce.
   */
  watch() {
    logger.log('info',`Watching is not yet possible`);
  }

  /** Deletes all the content in the src and .force folder, take care as this is not
   * the expected functionality later
   */
  clean() {
    this.project.clean().catch(err => logger.log('error','Clean failed',err));
  }
}

module.exports = Force;
