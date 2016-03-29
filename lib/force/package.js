'use strict'

var fs = require('fse-promise');
var logger = require('winston');
var checksum = require('checksum');
var path = require('path');
var Stream = require('stream');
var async = require('async');
var AdmZip = require('adm-zip');
var changes = require('./change-log');
var util = require('./util');

/**
 * Abstraction of not only the package.xml but the relevant contents
 * for deployment or retrieval
 */
class Package {
  constructor(force) {
    this.force = force;
    this.src = force.project.config.src;
  }

  get xml() {
    return fs.readFile(this.file,'utf-8');
  }

  get js() {
    return this.xml.then(
      xml => util.xmlToJs(xml).then(js => {
        delete js.Package.$;
        return Promise.resolve(js.Package);
      })
    );
  }

  get file() {
    return `${this.src}/package.xml`;
  }

  /**
   * TODO: Refactor
   * Extracts the provided package zip data
   * @param {string} data - base64 encoded data
   */
  extract(data) {
    logger.log('info','Extracting package data');

    let zip = new AdmZip(new Buffer(data,'base64'));
    let entries = zip.getEntries();

    async.each(entries,(entry) => {
      let text = zip.readAsText(entry);
      let loc = [
        this.src,
        entry.entryName.replace(new RegExp(`(unpackaged\/|${entry.name})`,'g'),'')
      ].join('/');

      // if(changes.hasChanged(entry.name)) {
      //   logger.log('debug','Skipping locally modified file: ', entry.name);
      // } else {
        logger.log('debug','Saving new or modified file: ', `${loc}${entry.name}`);

        let sum = checksum(text);

        // Add the changed file
        changes.add(entry.name,{ local: sum, remote: sum });

        // Extract the entry
        zip.extractEntryTo(entry,loc,false,true);
      // }
    },(err) => console.log(err));
  }

  /**
   * TODO: Refactor this..
   * Creates a package zip
   * @param {boolean} changedOnly - Packages only changed files, default: true
   * @returns {Promise} Resolves the zip buffer
   */
  create(changedOnly) {
    let zip = new AdmZip();
    let items = [];
    if(!changedOnly) changedOnly = true;

    return new Promise((resolve,reject) => {
      // For starters lets just push up the package folder
      fs.walk(this.src)
        .pipe(util.skipFile)
        .on('data', (item) => {
          let filename = path.basename(item.path);
          let filePath = this._zippedFilePath(item.path);

          // TODO: Fix up this area. Had hassles doing async read in here
          let text = fs.readFileSync(item.path,'utf-8');
          let sum = checksum(text);

          // Set local checksum
          changes.add(filename,{ local:sum });

          if(changes.hasChanged(filename) || filename === 'package.xml') {
            // Add file
            zip.addFile(filePath,new Buffer(text,'utf-8'));
            items.push(item.path);
          }
        })
        .on('end', () => {
          if(items.length <= 1) {
            logger.log('info','No changes detected');
            reject('Nothing changed');
          } else {
            logger.log('debug',`Changed files: `, items);
            resolve(zip.toBuffer());
          }
        });
    })
  }

  _zippedFilePath(localPath) {
    let rel = path.relative(process.cwd(),localPath);
    return rel.replace(this.src.replace('./',''),'unpackaged');
  }
}

module.exports = Package;
