'use strict'

/**
 * @module Abstraction of various operations from JSforce api impl
 */

var jsforce = require('jsforce');
var logger = require('winston');
var fs = require('fse-promise');
var util = require('./util');

class Api {
  constructor(force) {
    this.force = force;
  }

  /** Connects to salesforce
   * @return {Promise} The result of the connect / login
   */
  connect() {
    let options = this.force.options;
    let url = `https://${options.host}`;

    this.conn = new jsforce.Connection({
      loginUrl: url
    });

    // Set timeout hard here for now
    this.conn.metadata.pollTimeout = 60000;

    // Password is the password and the token combined, the token is required
    let pass = options.password + options.token;

    logger.log('debug',`Logging into ${url} as user: ${options.username}`);

    return this._login(options.username,pass);
  }

  /// Perform login
  _login(username,password) {
    return new Promise((resolve,reject) => {
      this.conn.login(username,password,(err,info) => {
        if(err) reject(err);
        else resolve(info);
      })
    });
  }

  /** Retrieves data from salesforce org using some package.xml
   * @return {Promise} The result of the retrieve
   */
  retrieve(pkg) {
    let options = this.force.options;

    // Create the retrieve request
    let request = {
      apiVersion: options.apiVersion,
      unpackaged: pkg
    }

    logger.log('debug',`Retrieving data using request:`,request);

    return this._jsForceRetrieve(request);
  }

  // Promisify the force retrieve
  _jsForceRetrieve(request) {
    return new Promise((resolve,reject) => {
      this.conn.metadata.retrieve(request).complete((err,result) => {
        console.log('result....');
        if(err) {
          reject(err);
        } else {
          logger.log('debug', `Received result: `, result);
          resolve(result);
        }
      });
    });
  }

  /** Deploys to salesforce from some package.xml
   * @return {Promise} The result of the deploy
   */
  deploy(stream) {
    return this._jsForceDeploy(stream);
  }

  // Promisify the jsforce deploy
  _jsForceDeploy(stream) {
    // let tests = this.force.options.runTests;

    return new Promise((resolve,reject) => {
      this.conn.metadata.deploy(stream/*,{ runTests:tests }*/).complete(true,(err,result) => {
        // TODO: Results with failed status should be rejected?
        if(err) {
          reject(err);
        } else {
          logger.log('debug', `Received result: `, result);
          resolve(result);
        }
      })
    });
  }
}

module.exports = Api;
