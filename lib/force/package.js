'use strict'

var arch = require('simple-archiver');
var fs = require('fse-promise');
var path = require('path');
var logger = require('winston');
var checksum = require('checksum');
var Project = require('./project');
var skipFile = require('./util').skipFile;
var xmlToJs = require('./util').xmlToJs;
var xmlBuilder = require('./util').xmlBuilder;

/** Packages a project up for deployment or retrieval */
class Packager {
  constructor(project) {
    this.project = project;
    this.descr = project.descriptor;
  }

  /** Get relevant project files and compress to zip
   * @return {Promise} The result of the archiving process */
  compress() {
    // // TODO: Replace this per below
    // return arch.archive(this.src);

    logger.debug('');

    return this._getProjectFiles(tmp).then(files => {
      let moveResults = [];

      files.forEach(file => {
        // moveResults.push(this._moveFile(file).then(() => fs.remove(tmp)));
        moveResults.push(this._moveFile(file));
      });

      return Promise.all(moveResults).then(() => fs.remove(tmp));
    })
  }

  /** Extracts the provided archive into the project loc
   * @param {Archive} - From simple-archiver / archiver
   * @return {Promise} The result of the extraction process */
  extract(archive) {
    // Extract into tmp folder
    return arch.extract(archive, this.tmp).then(() => this._moveExtracted(this.tmp));
  }

  /** Extracts the provided base64 string data
   * @param {string} data - Base64 string from zip
   * @return {Promise} The result of the extraction process */
  extractData(data) {
    return this.extract(new Buffer(data, 'base64'));
  }

  /** Extract from, some retrieve result
   * @param {RetrieveResults} - Results from the retrieve api
   * @return {Promise} The result of the extraction process */
  extractResult(result) {
    // Need this if we want the file stats later
    this.result = result;

    // Extract the data
    return this.extractData(result.zipFile);
  }

  // Temp folder for extract
  get tmp() {
    return `${this.project.FOLDER}/.tmp`
  }
  get src() {
    return this.project.options.src
  }

  // Extracted files are moved, later can check for changes etc
  _moveExtracted(tmp) {
    logger.debug('');

    return this._getProjectFiles(tmp).then(files => {
      let moveResults = [];

      files.forEach(file => {
        // moveResults.push(this._moveFile(file).then(() => fs.remove(tmp)));
        moveResults.push(this._moveFile(file));
      });

      return Promise.all(moveResults).then(() => fs.remove(tmp));
    })
  }

  // Move a single file, occurs during pull
  _moveFile(file) {
    let chgResult;
    let dest = file.path.replace(new RegExp('.*\/unpackaged', 'i'), this.src);
    let changes = this.project.changeLog;

    return this._updateRemoteState(file.path)
      .then(() => this._updateLocalState(dest))
      .then(() => this._isChanged(file))
      .then(changed => {
        if (!changed) {
          logger.debug(`Moving ${file.name} to '${dest}'`);

          // Move the file, respect the move and override any existing
          return fs.move(file.path, dest, {
            clobber: true
          });
        } else {
          logger.debug(`Skipping changed file '${dest}'`);
        }
      })
  }

  // Package a file into an archive
  _packageFile(file, archive) {

  }

  // TODO Refactor all of this. Updates the local file state
  _updateLocalState(file) {
    let changes = this.project.changeLog;
    let name = path.basename(file);

    if(!this._isTrackable(name)) return Promise.resolve();

    // Read out the local file
    return fs.exists(file).then(exists => {
      if (!exists) {
        // Local doesnt actually exist for some reason, there must be some new remote file
        let local = changes.getRemoteState(name);

        // Copy the remote state as the local state
        return changes.addLocal(name, local);
      } else {
        return fs.readFile(file, 'utf8').then(text => {
          let local = {
            hash: checksum(text.toString()),
            time: fs.statSync(file).mtime.getTime()
          }

          return changes.addLocal(name, local);
        });
      }
    })
  }

  // TODO Refactor all of this.  Updates the remote file state
  _updateRemoteState(file) {
    let name = path.basename(file);
    let changes = this.project.changeLog;

    if (!this.result || !this._isTrackable(name)) return Promise.resolve();

    let props = this.result.fileProperties;
    let fileProp = props.find(p => p.fullName === path.parse(file).name);

    // Return the promise chain from reading the file then adding the remote entry
    return fs.readFile(file, 'utf8').then(text => {
      let remote = {
        hash: checksum(text.toString()),
        time: new Date(fileProp.lastModifiedDate).getTime()
      }
      return changes.addRemote(path.basename(file), remote);
    });
  }

  // TODO: Refactor. Determines if some file is changed
  _isChanged(file) {
    let options = this.project.options;
    let changes = this.project.changeLog;

    // TODO see all the todo comments, not happy with these solutions
    if(!this._isTrackable(file.name)) return false;

    // Return the change check else just mark as unchanged
    return options.respectLocalChanges ? changes.hasChanged(file.name) : false;
  }

  // TODO: Get rid of this when fixing all the above issues
  _isTrackable(fileName) {
    let regex = /(-meta\.xml|package\.xml)/i;
    return (fileName.match(regex) == null);
  }

  // Given a specific dir, reads out all the files
  _getProjectFiles(dir) {
    let files = [];
    let chgLog = this.project.changeLog;

    return new Promise((resolve, reject) => {
      fs.walk(dir)
        .pipe(skipFile)
        .on('data', (item) => {
          let name = path.basename(item.path);
          let file = {
            name: name,
            path: item.path,
            modified: item.stats.mtime.getTime()
          }

          // Add the file
          files.push(file);
        })
        .on('end', () => resolve(files))
        .on('error', err => reject(err));
    });
  }
}

/** Describes a package, essentially its a package.xml, best name i got right now */
class PackageDescriptor {
  constructor(pkg, version) {
    this.ns = 'http://soap.sforce.com/2006/04/metadata';
    this.pkg = pkg || {
      types: [{
        members: '*',
        name: 'ApexClass'
      }, {
        members: '*',
        name: 'ApexComponent'
      }, {
        members: '*',
        name: 'ApexPage'
      }, {
        members: '*',
        name: 'ApexTrigger'
      }, {
        members: '*',
        name: 'StaticResource'
      }],
      version: version || '36.0'
    };

    this.pkg.$xmlns = this.ns;
  }

  /** Async factory method to produce package object */
  static fromXml(xml) {
    return xmlToJs(xml).then(js => {
      new Package(js.Package)
    });
  }

  // Just return the package as is
  toJs() {
    return this.pkg;
  }

  // Build the xml output
  toXml() {
    return builder.buildObject(this.pkg);
  }
}

module.exports = {
  Packager: Packager,
  PackageDescriptor: PackageDescriptor
}
