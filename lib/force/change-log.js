'use strict'

var fs = require('fse-promise');

class ChangeLog {
  constructor(src) {
    this.dir = src;
    this.file = `${src}/log.json`;
    this.log = fs.existsSync(this.file) ? fs.readJsonSync(this.file) : {};
  }

  // Add a new entry
  add(key,entry) {
    if(!entry) return;

    // TODO Implement logic

    return _write();
  }

  // Add a new entry sync
  addSync(key,entry) {
    if(!entry) return;

    // TODO Implement logic

    return _write(true);
  }

  // Remove an entry
  remove(key) {
    delete this.log[key];
    return _write();
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

  reset() {
    this.log = {};
    return _write();
  }

  _write(sync) {
    return sync ?
      fs.outputJsonSync(this.file,this.log) : fs.outputJson(this.file,this.log);
  }
}

module.exports = ChangeLog;
