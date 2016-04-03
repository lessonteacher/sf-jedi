'use strict'

var logger = require('winston');
var Api = require('./force/api');
var Project = require('./force/project');
var Packager = require('./force/package').Packager;

class Force {
  constructor(options) {
    // Set default options
    this.options = Object.assign({
      // Overall options
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
      token: process.env.SF_TOKEN,
      host: process.env.SF_HOST,

      // Addition special options
      apiVersion: '36.0',

      // Logging specific
      logging: {
        level: 'info',
        handleUnchecked: true,
        exitOnError: true,
      },

      project: { /* see Project constructor */ }

    }, options);

    this._setupLogger(this.options.logging);

    this.project = new Project(this.options.project);
  }

  /** Initalises a .force folder and relevant files / metadata */
  init() {
    this._validateExecution(true);

    let proj = this.project;

    if (proj.isNew()) {
      logger.info('Initializing project...');

      return proj.setup().then(() => proj.options.pullOnInit ?
        this.pull() : Promise.resolve()
      ).catch(err => logger.log('error', err));

    } else {
      return Promise.resolve(logger.info('Project is already set up'));
    }
  }

  /**
   * Pulls the full set of metadata from salesforce creating any files that
   * dont exist.
   */
  pull() {
    this._validateExecution();

    let proj = this.project;
    let api = new Api(this.options);

    logger.info('Pulling project...');

    return api.connect()
      .then(() => api.retrieve(proj.descriptor.toJs()))
      .then(result => new Packager(proj).extractResult(result))
      .catch(err => logger.error(err));
  }

  /** Pushes changes if any have occurred up to salesforce */
  push() {
    this._validateExecution();

    let proj = this.project;
    let api = new Api(this.options);

    logger.info('Pushing project...');

    // Leverage the async by doing ahead here
    let result = new Packager(proj).compress()

    // Connect
    return api.connect()
      .then(() => result.then(buffer => api.deploy(buffer)))
      .catch(err => logger.error(err));
  }

  /**
   * Watches for changes and pushes any if they occur immediately up to salesforce
   * Has binding mode to allow for subscription as well in order to respond to
   * changes which occur directly in salesforce.
   */
  watch() {
    throw new Error(`Watching is not yet possible`);
  }

  /** Deletes all the content in the src and .force folder, take care... */
  reset() {
    logger.info('Resetting folders...');
    return this.project.reset();
  }

  // Checks some required conditions
  _validateExecution(isNew) {
    if (!isNew && this.project.isNew()) throw new Error('Project has not been initialized');
    if (!this._credentialsValid(this.options)) throw new Error('The username, password and token have not been set')
  }

  // Check the basic credentials to run are set
  _credentialsValid(options) {
    return (options.username && options.password && options.token);
  }

  // Setup winston
  _setupLogger(logging) {
    logger.remove(logger.transports.Console);
    logger.add(logger.transports.Console, {
      level: logging.level,
      colorize: true,
      handleExceptions: logging.handleUnchecked,
      humanReadableUnhandledException: true,
      exitOnError: true
        // formatter: function(options) { }
    });
    logger.level = logging.level; // Just in case
  }
}

module.exports = Force;
