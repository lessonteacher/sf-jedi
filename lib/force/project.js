'use strict'

var async = require('async');
var fs = require('fse-promise');
var logger = require('winston');
var ChangeLog = require('./change-log');
var PackageDescriptor = require('./package').PackageDescriptor;
var Packager = require('./package').Packager;

class Project {
  get FOLDER() { return './.force'; }

  constructor(options) {
    this.options = Object.assign({
      src: `${this.FOLDER}/src`,
      changeDir: `${this.FOLDER}/changes`,

      // Other specific options
      pullOnInit: false,
      createMetaXml: true,
      deleteSrcOnReset: true,

      /* package.xml as can be set as json, see PackageDescriptor for defaults */
    },options);

    // Init other objects
    async.parallel([
      (callback) => {
        this.changeLog = new ChangeLog(this.options.changeDir);
        callback(null);
      },
      (callback) => {
        this.descriptor = this._initDescriptor();
        callback(null);
      }
    ]);

    // Put the package descriptor in there for good measure
    this.options.package = this.descriptor.toJs();
  }

  // Check if .force exists
  isNew() {
    return !fs.existsSync(this.FOLDER);
  }

  // Create a new project
  setup() {
    let dir = this.FOLDER;
    let options = this.options;

    // Just create the project folder
    return fs.outputJson(`${dir}/project.json`, options)
      .then(() => logger.info('Created project files/folders'));
  }

  /** Resets the force dir and src dir */
  reset() {
    let del = this.options.deleteSrcOnReset;

    return Promise.all([
      fs.exists(this.FOLDER).then(exists => fs.remove(this.FOLDER))
        .then(logger.info(`Deleted '${this.FOLDER}'`)),
      fs.exists(this.options.src)
        .then(exists => (exists && del) ? fs.remove(this.options.src) : Promise.resolve())
        .then(logger.info(`Deleted '${this.options.src}'`))
    ]);
  }

  // Reads from some existing xml otherwise creates default
  // This simply accommodates for people who want to create their xml
  // or who want to change the xml directly not via the init package
  _initDescriptor(sync) {
    let options = this.options;
    let file = `${options.src}/package.xml`;

    // if(fs.existsSync(file)) {
    //   // TODO: Respect changes to the XML, this async call causes hassles
    //   // return PackageDescriptor.fromXml(fs.readFileSync(file,'utf-8'));
    // } else {
      return new PackageDescriptor(options.package);
    // }
  }
}

module.exports = Project;
