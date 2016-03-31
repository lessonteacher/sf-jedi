'use strict'

var async = require('async');
var arch = require('simple-archiver');
var fs = require('fse-promise');
var path = require('path');
var logger = require('winston');
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
    // TODO: Replace this per below
    return arch.archive(this.src);

    // TODO: Go file by file and check for changes, create metadata etc
    // this._getProjectFiles(this.src)
  }

  /** Extracts the provided archive into the project loc
    * @return {Promise} The result of the extraction process */
  extract(archive) {
    // Extract into tmp folder
    return arch.extract(archive,this.tmp).then(() => this._moveExtracted(this.tmp));
  }

  /** Extracts the provided base64 string data
    * @return {Promise} The result of the extraction process */
  extractData(data) {
    return this.extract(new Buffer(data,'base64'));
  }

  // Temp folder for extract
  get tmp() { return `${this.project.FOLDER}/.tmp` }
  get src() { return this.project.options.src}

  // Extracted files are moved, later can check for changes etc
  _moveExtracted(tmp) {
    logger.debug('');
    return this._getProjectFiles(tmp)
      .then(files => async.each(files,this._moveFile.bind(this),(err) => Promise.reject(err)))
      .then(() => fs.remove(tmp));
  }

  // Move a single file
  _moveFile(file) {
    let dest = file.path.replace(new RegExp('.*\/unpackaged','i'),this.src);

    logger.debug(`Moving ${file.name} to '${dest}'`);

    // Move the file
    fs.move(file.path,dest,{clobber:true});
  }

  // Given a specific dir, traverses the files and determines if they should
  // be considered for move or packaging
  _getProjectFiles(dir) {
    let files = [];

    return new Promise((resolve, reject) => {
      fs.walk(dir)
        .pipe(skipFile)
        .on('data', (item) => {
          let name = path.basename(item.path);
          let file = {
            name: name,
            path: item.path
          }

          // Add the file
          files.push(file);

          // TODO Bring in the changes feature

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
      types: [
        { members: '*', name: 'ApexClass' },
        { members: '*', name: 'ApexComponent' },
        { members: '*', name: 'ApexPage' },
        { members: '*', name: 'ApexTrigger' },
        { members: '*', name: 'StaticResource' }
      ],
      version: version || '34.0'
    };

    this.pkg.$xmlns = this.ns;
  }

  /** Async factory method to produce package object */
  static fromXml(xml) {
    return xmlToJs(xml).then(js => {
      console.log('processing ml')
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
