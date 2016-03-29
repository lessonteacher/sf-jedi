'use strict'

var fs = require('fse-promise');
var logger = require('winston');

/** Initializes a .force project by looking for the .force folder and if it
 * doesnt exist it creates the folder and config.
 */
class Project {
  constructor(force) {
    this.force = force;

    // Read stored config else set default / provided
    if(!this.isNew()) {
      this.config = this._readStoredConfig();
    } else {
      this.config = {
        src: `${this.forceDir}/src`
      }

      Object.assign(this.config,force.options.project);
    }
  }

  /**
   * Initializes force project
   * @return {Promise} The async result, generally of a pull
   */
  init() {
    let options = this.force.options;

    logger.log('info',`Initializing .force/ folder if necessary`);

    // If new then do initial folder setup, else pull the metadata
    if(this.isNew()) {
      var setup = this.setup(this.config);
    }

    // If auto pull is set then do that
    if(options.autoPull) {
      return setup ? setup.then(() => this.force.pull()) : this.force.pull();
    } else {
      return setup || Promise.resolve();
    }
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
      this._setDefaultProjectXml()
    ]);
  }

  /// Sets up the default project XML by copying the template if necessary
  _setDefaultProjectXml() {
    return fs.exists(`${this.config.src}/package.xml`).then(exists => {
      if(!exists)return fs.copy(`${__dirname}/../meta/package.xml`,`${this.config.src}/package.xml`)
      else Promise.resolve('Done');
    })
  }

  // Check if .force exists
  isNew() {
    return !fs.existsSync(this.forceDir);
  }

  // Read out the stored config
  _readStoredConfig(async) {
    let file = `${this.forceDir}/project.json`;

    if(async) {
      return fs.readJson(file).then(config => {
        if(config.src) this.src = config.src;
      });
    } else {
      return fs.readJsonSync(file);
    }
  }

  /** @return {string} Computed force dir path */
  get forceDir() { return './.force'; }

  /** At the moment, this will obliterate everything here */
  reset() {
    return Promise.all([
      fs.exists(this.forceDir).then(exists => fs.remove(this.forceDir)),
      fs.exists(this.config.src).then(exists => fs.remove(this.config.src))
    ]);
  }
}

module.exports = Project;
