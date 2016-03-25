'use strict'

var fs = require('fs-promise');

/** Initializes a .force project by looking for the .force folder and if it
 * doesnt exist it creates the folder and config.
 */
class Initializer {
  constructor(force) {
    this.force = force;
    this.config = force.options.project || {
      // Setup the default config here
      testOption: 'This is a potential value'
    };
  }

  /** Initializes force project */
  init() {
    // If new then do initial folder setup, else pull the metadata
    if(this._isNew()) this.setup(this.config);
    else this.force.pull();
  }

  /** Creates .force and config */
  setup(config) {
    let dir = this.forceDir;

    Promise.all([
      fs.outputJson(`${dir}/project.json`, config),
      fs.outputJson(`${dir}/changes/log.json`, {}),
      fs.copy('../meta/package.xml',`${dir}/package/package.xml`)
    ])
    .then(() => force.pull())      // Pull metadata
    .catch(err => { throw err; }); // Throw error
  }

  // Check if .force exists
  _isNew() {
    return !fs.existsSync(this.forceDir);
  }

  get forceDir() { return [this.force.rootDir,'.force'].join('/'); }

}

module.exports = Initializer;
