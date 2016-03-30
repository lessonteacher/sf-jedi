'use strict'

var logger = require('winston');
var jsforce = require('jsforce');

class Api {
  // This is because primarly Grunt will be used and I want it to mixin options.
  // All of these options can be added to the 'options' for a push
  static get DEPLOY_OPTIONS(){
    return [
      'allowMissingFiles','autoUpdatePackage','checkOnly','ignoreWarnings',
      'performRetrieve','purgeOnDelete','rollbackOnError','runAllTests','runTests',
      'singlePackage','testLevel'
    ];
  }

  constructor(options) {
    this.options = Object.assign({
      pollTimeout: 60000,
      pollInterval: 2000,
      includeDetails: true,
    },options);
  }

  /** Connects to salesforce
   * @return {Promise} The result of the connect / login
   */
  connect() {
    let options = this.options;
    let url = `https://${options.host}`;

    // Password is the password and the token combined, the token is required
    let pass = options.password + options.token;

    this.conn = new jsforce.Connection({
      loginUrl: url
    });

    this._setConnDefaults(this.options);

    logger.log(`Connected to ${url}`);

    return this.login(options.username,pass);
  }

  // Perform login
  login(username,password) {
    return new Promise((resolve,reject) => {
      this.conn.login(username,password,(err,info) => {
        if(err) reject(err);
        else {
          logger.log(`Logged in as ${username}`);
          resolve(info);
        }
      })
    });
  }

  /** Retrieves data from salesforce org using some package.xml
   * @return {Promise} The result of the retrieve
   */
  retrieve(pkg) {
    let options = this.options;

    // Create the retrieve request
    let request = {
      apiVersion: options.apiVersion,
      unpackaged: pkg.toZip()
    }

    logger.log(`Pulling data...`);

    return this._jsForceRetrieve(request).then(result => _logResult(result));
  }

  /** Deploys to salesforce the package
   * @return {Promise} The result of the deploy
   */
  deploy(pkg) {
    return this._jsForceDeploy(pkg).then(result => _logResult(result));
  }

  // Promisify the jsforce deploy
  _jsForceDeploy(stream) {
    let detailed = this.options.includeDetails;
    let opt = this._setDeployDefaults(this.options);

    return new Promise((resolve,reject) => {
      this.conn.metadata.deploy(stream,opt).complete(detailed,(err,result) => {
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    });
  }

  // Promisify the force retrieve
  _jsForceRetrieve(request) {
    return new Promise((resolve,reject) => {
      this.conn.metadata.retrieve(request).complete((err,result) => {
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Sets some defaults on the connection
  _setConnDefaults(options) {
    let meta = this.conn.metadata;

    meta.pollTimeout = options.pollTimeout;
    meta.pollInterval = options.pollInterval;
  }

  // Set the deploy defaults
  _getDeployDefaults(options) {
    let result = {};

    for(let opt in Api.DEPLOY_OPTIONS) {
      if(options[opt]) result[opt] = options[opt];
    }

    return result;
  }

  // Produces the output from the result object
  _logResult(result) {
    // TODO Implement!
  }
}

module.exports = Api;
