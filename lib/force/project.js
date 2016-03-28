'use strict'

var fs = require('fse-promise');
var logger = require('winston');

/** Initializes a .force project by looking for the .force folder and if it
 * doesnt exist it creates the folder and config.
 */
class Project {
  constructor(force) {
    this.force = force;
    this.config = force.options.project || {
      src: `${this.forceDir}/src`
    };
  }

  /**
   * Initializes force project
   * @return {Promise} The async result, generally of a pull
   */
  init() {
    logger.log('info',`Initializing .force/ folder if necessary`);

    // If new then do initial folder setup, else pull the metadata
    if(this._isNew()) return this.setup(this.config);
    else return this.force.pull();
  }

  /**
   * Creates .force and related files / folders
   * @return {Promise} The result chain of the file creation / pull
   */
  setup(config) {
    logger.log('debug',`Creating the .force/ folder and subfolders`);

    let dir = this.forceDir;

    return Promise.all([
      fs.outputJson(`${dir}/project.json`, config),
      fs.outputJson(`${dir}/changes/log.json`, {}),
      fs.copy('./lib/meta/package.xml',`${this.config.src}/package.xml`)
    ])
    .then(result => this.force.pull()) // Pull metadata
    .catch(err => console.log(err));   // Log error
  }

  // Check if .force exists
  _isNew() {
    return !fs.existsSync(this.forceDir);
  }

  /** @return {string} Computed force dir path */
  get forceDir() { return './.force'; }
}

module.exports = Project;
