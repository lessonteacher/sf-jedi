'use strict'

var fs = require('fse-promise');

class ChangeLog {
  constructor(src) {
    this.dir = src;
    this.file = `${src}/log.json`;
    this.log = fs.existsSync(this.file) ? fs.readJsonSync(this.file) : {};
  }

  /* Add an entry e.g.
  {
    local: {
      hash: ABDSdhsdhee,
      time: 1459654919
    },
    remote: {
      hash: ABDSdhsdhee,
      time: 1459654919
    }
  }
  */
  add(key,entry) {
    if(!entry) return Promise.resolve();
    this.log[key] = entry;
    return this._write();
  }

  // Add a new entry sync
  addSync(key,entry) {
    if(!entry) return;
    this.log[key] = entry;
    return this._write(true);
  }

  addLocal(key,value) {
    return this._addSub(key,value,'local');
  }

  addRemote(key,value) {
    return this._addSub(key,value,'remote');
  }

  _addSub(key,value,part) {
    let entry = this.log[key] || {};

    entry[part] = value;
    return this.add(key,entry);
  }

  // Remove an entry
  remove(key) {
    delete this.log[key];
    return this._write();
  }

  /** Check the existence of a given key in the log */
  exists(key) {
    return this.log.hasOwnProperty(key);
  }

  /** Get an entry by key
   * @param {string} key - The key of the entry */
  getEntry(key) {
    return this.log[key];
  }

  /** Get the remote state of a given key
   * @param {string} key - The entry key, usually a filename
   * @return {Object} The remote part of an entry */
  getRemoteState(key) {
    let entry = this.log[key];
    return entry ? entry.remote : null;
  }

  /** Get the local state of a given key
   * @param {string} key - The entry key, usually a filename
   * @return {Object} The local part of an entry */
  getLocalState(key) {
    let entry = this.log[key]
    return entry ? entry.local : null;
  }

  /** Check if has been changed for a given key locally or remotely, using time
   * @param {string} key - The entry key
   * @param {boolean} checkTime - Indicates if the time should be included in the check
   * @param {string} source - [optional] 'local' or 'remote', default is local */
  hasChanged(key, checkTime, source) {
    if(!source) source = 'local';

    let entry = this.log[key];

    if(!entry) return true; // An entry that doesnt exist must be new local or remote

    let diff = (entry.local.hash !== entry.remote.hash);

    if(checkTime) {
      return diff && (source == 'local') ? entry.local.time > entry.remote.time
                                         : entry.local.time < entry.remote.time;
    };

    return diff;
  }

  // Remove an entry sync
  removeSync(key) {
    delete this.log[key];
    return _write(true);
  }

  /** @return {boolean} True if there are no entries in the log */
  isEmpty() {
    return this.log.length == 0;
  }

  /** Resets the log */
  reset() {
    this.log = {};
    return this._write();
  }

  _write(sync) {
    return sync ?
      fs.outputJsonSync(this.file,this.log) : fs.outputJson(this.file,this.log);
  }
}

module.exports = ChangeLog;
