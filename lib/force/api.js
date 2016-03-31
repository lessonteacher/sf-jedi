'use strict'

var logger = require('winston');
var jsforce = require('jsforce');

class Api {
  // This is because primarly Grunt will be used and I want it to mixin options.
  // All of these options can be added to the 'options' for a push
  static get DEPLOY_OPTIONS() {
    return [
      'allowMissingFiles', 'autoUpdatePackage', 'checkOnly', 'ignoreWarnings',
      'performRetrieve', 'purgeOnDelete', 'rollbackOnError', 'runAllTests', 'runTests',
      'singlePackage', 'testLevel'
    ];
  }

  constructor(options) {
    this.options = Object.assign({
      pollTimeout: 60000,
      pollInterval: 2000,
      includeDetails: true,
    }, options);
  }

  /** Connects to salesforce
   * @return {Promise} The result of the connect / login */
  connect() {
    let options = this.options;
    let url = `https://${options.host}`;

    // Password is the password and the token combined, the token is required
    let pass = options.password + options.token;

    this.conn = new jsforce.Connection({
      loginUrl: url
    });

    this._setConnDefaults(this.options);

    logger.info(`Connected to ${url}`);

    return this.login(options.username, pass);
  }

  /** Login to salesforce, just use connect
   * @return {Promise} The result */
  login(username, password) {
    return new Promise((resolve, reject) => {
      this.conn.login(username, password, (err, info) => {
        if (err) reject(err);
        else {
          logger.info(`Logged in as ${username}`);
          resolve(info);
        }
      })
    });
  }

  /** Retrieves data from salesforce org using some package object
   * @return {Promise} The result of the retrieve
   */
  retrieve(packageJs) {
    // Get rid of the namespace
    delete packageJs.$xmlns;

    let options = this.options;

    // Create the retrieve request
    let request = {
      apiVersion: options.apiVersion,
      unpackaged: packageJs
    }

    return this._jsForceRetrieve(request)
      .then(result => new RetrieveResults(result).writeLog());
  }

  /** Deploys to salesforce the package
   * @return {Promise} The result of the deploy
   */
  deploy(buffer) {
    return this._jsForceDeploy(buffer)
      .then(result => new DeployResults(result).writeLog());
  }

  // Promisify the jsforce deploy
  _jsForceDeploy(buffer) {
    let detailed = this.options.includeDetails;
    let opt = this._getDeployDefaults(this.options);

    return new Promise((resolve, reject) => {
      this.conn.metadata.deploy(buffer, opt).complete(detailed, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    });
  }

  // Promisify the force retrieve
  _jsForceRetrieve(request) {
    return new Promise((resolve, reject) => {
      this.conn.metadata.retrieve(request).complete((err, result) => {
        if (err) {
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

    for (let opt in Api.DEPLOY_OPTIONS) {
      if (options[opt]) result[opt] = options[opt];
    }

    return result;
  }
}

class Results {
  constructor(result) {
    this.result = result;
  }

  asArray(arr) {
    if (!arr) { return []; }
    if (Object.prototype.toString.apply(arr) !== '[object Array]') { arr = [ arr ]; }
    return arr;
  }

  writeLog() {
    throw 'Not implemented';
  }
}

/** Encapsulate the deploy results. Log writing from jsforce-metadata-tools */
class RetrieveResults extends Results {
  writeLog() {
    let res = this.result;
    let message =
      String(res.success) === 'true' ? 'Pull Succeeded' :
      String(res.done) === 'true' ? 'Pull Failed' : 'Pull Not Completed Yet';

    logger.info(message);
    if (res.errorMessage) {
      logger.info(res.errorStatusCode + ': ' + res.errorMessage);
    }

    logger.info('');
    logger.info('Id: ' + res.id);
    logger.info('Status: ' + res.status);
    logger.info('Success: ' + res.success);
    logger.info('Done: ' + res.done);

    if(logger.level === 'debug') this._writeFileProperties(res.fileProperties);
    return Promise.resolve(res);
  }

  _writeFileProperties(fileProperties) {
    fileProperties = this.asArray(fileProperties);

    if (fileProperties.length > 0) {
      logger.debug('');
      logger.debug('Files:');
      fileProperties.forEach(function(f) {
        logger.debug(' - ' + f.fileName + (f.type ? ' ['+f.type+']' : ''));
      });
    }
  }
}

/** Encapsulate the deploy results. Log writing from jsforce-metadata-tools */
class DeployResults extends Results {
  writeLog() {
    let res = this.result;
    let message =
      res.success ? 'Push Succeeded' + (res.status === 'SucceededPartial' ? ' Partially' : '.') :
      res.done ? 'Push Failed' : 'Push Not Completed Yet';
    logger.info(message);

    if (res.errorMessage) {
      logger.info(res.errorStatusCode + ': ' + res.errorMessage);
    }

    logger.info('');
    logger.info('Id: ' + res.id);
    logger.info('Status: ' + res.status);
    logger.info('Success: ' + res.success);
    logger.info('Done: ' + res.done);
    logger.info('Number Component Errors; ' + res.numberComponentErrors);
    logger.info('Number Components Pushed: ' + res.numberComponentsDeployed);
    logger.info('Number Components Total: ' + res.numberComponentsTotal);
    logger.info('Number Test Errors; ' + res.numberTestErrors);
    logger.info('Number Tests Completed: ' + res.numberTestsCompleted);
    logger.info('Number Tests Total: ' + res.numberTestsTotal);

    if (res.details) this._writeDetails(res.details);
    return Promise.resolve(res);
  }

  _writeDetails(details) {
    var successes = this.asArray(details.componentSuccesses);
    if (successes.length > 0) {
      logger.debug('');
      logger.debug('Successes:');
    }
    successes.forEach(function(s) {
      var flag =
        String(s.changed) === 'true' ? '(M)' :
        String(s.created) === 'true' ? '(A)' :
        String(s.deleted) === 'true' ? '(D)' :
        '(~)';
      logger.debug(' - ' + flag + ' ' + s.fileName + (s.componentType ? ' [' + s.componentType + ']' : ''));
    });

    var failures = this.asArray(details.componentFailures);
    if (failures) {
      if (failures.length > 0) {
        logger.error('');
        logger.error('Failures:');
      }
      failures.forEach(function(f) {
        logger.error(
          ' - ' + f.problemType + ' on ' + f.fileName +
          (typeof f.lineNumber !== 'undefined' ?
            ' (line ' + f.lineNumber + (f.columnNumber ? ':' + f.columnNumber : '') + ')' :
            '') +
          ' : ' + f.problem
        );
      });
    }
    var testResult = details.runTestResult;
    if (testResult && Number(testResult.numTestsRun) > 0) {
      logger.info('');
      logger.info('Test Total Time: ' + Number(testResult.totalTime));
      logger.info('');

      var testSuccesses = this.asArray(testResult.successes) || [];
      if (testSuccesses.length > 0) {
        logger.debug('Test Successes:');
      }
      testSuccesses.forEach(function(s) {
        logger.debug(' - ' + (s.namespace ? s.namespace + '__' : '') + s.name + '.' + s.methodName);
      });

      var testFailures = asArray(testResult.failures) || [];
      if (testFailures.length > 0) {
        logger.error('Test Failures:');
      }
      testFailures.forEach(function(f) {
        logger.error(' - ' + (typeof f.namespace === 'string' ? f.namespace + '__' : '') + f.name + '.' + f.methodName);
        logger.error('     ' + f.message);
        if (f.stackTrace) {
          f.stackTrace.split(/\n/).forEach(function(line) {
            logger.error('        at ' + line);
          });
        }
      });

      var codeCoverages = this.asArray(testResult.codeCoverage) || [];
      if (codeCoverages.length > 0) {
        logger.debug('Code Coverage:');
      }
      codeCoverages.forEach(function(s) {
        var coverage = Math.floor(100 - 100 * (s.numLocationsNotCovered / s.numLocations));
        if (isNaN(coverage)) {
          coverage = 100;
        }
        logger.debug(
          ' - ' +
          '[' +
          (coverage < 10 ? '  ' : coverage < 100 ? ' ' : '') + coverage +
          ' %] ' +
          (typeof s.namespace === 'string' ? s.namespace + '__' : '') + s.name
        );
      });
    }
  }
}

module.exports = Api;
