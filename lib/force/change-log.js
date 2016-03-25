'use strict'

var fs = require('fse-promise');

/** Abstraction of the stored change log */
class ChangeLog {
  constructor() {
    this.file = './.force/changes/log.json';
    this.log = fs.readJsonSync(this.file);
  }

  /**
   * Add an entry to the change log
   * @param {string} key - A key in the log file, e.g. 'FileName.cls'
   * @param {object} entry - A change entry, e.g. {local:'value',remote:'othervalue'}
   * @return {Promise} The async result of the fs write
   */
  add(key,entry) {
    if(!entry) return;

    if((!this.log[key]) || (entry.local && entry.remote)) this.log[key] = entry;
    else if(entry.local) _updateHash(key,entry.local,'local');
    else _updateHash(key,entry.local,'remote');

    return fs.writeJson(this.dir,this.log);
  }

  /**
   * Remove an entry to the change log
   * @param {string} key - A key in the log file, e.g. 'FileName.cls'
   * @return {Promise} The async result of the fs write
   */
  remove(key) {
    delete this.log[key];

    return fs.writeJson(this.file,this.log);
  }

  /**
   * @param {string} key - A key in the log file, e.g. 'FileName.cls'
   * @return {boolean} True if the entry has changed
   */
  hasChanged(key) {
    let entry = this.log[key];

    return !entry || entry.local === entry.remote ? false : true;
  }

  /** @return {boolean} True if there are no entries in the log */
  isEmpty() {
    return this.log.length == 0;
  }

  // Update the local or remote hash
  _updateHash(key,hash,source) {
    // Update the relevant hash
    this.log[key][source] = hash;
  }
}

module.exports = ChangeLog;
