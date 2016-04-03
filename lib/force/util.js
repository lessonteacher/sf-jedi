'use strict'

var xml2js = require('xml2js');
var through2 = require('through2');
var path = require('path');

/**
 * Returns a promise of the xml2js parseString
 * @param {string} xml - The xml to parse
 * @returns {Promise} resulting xml
 */
var xmlToJs = function(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray:false }, (err,js) => {
      if(err) reject(err);
      else resolve(js);
    });
  })
}

/** Function to skip directories during stream processing */
var skipFile = through2.obj(function (item, enc, next) {
  if(!item.stats.isDirectory()) this.push(item);
  next();
});

// /** Function to skip files during stream process */
// var skipFile = through2.obj(function (item, enc, next) {
//   // Skip directories, metadata trash, and package.xml which will be dynamically created
//   let name = path.basename(item.path);
//   let regex = /(-meta\.xml$|package\.xml$)/i;
//
//   if(!item.stats.isDirectory() && name.match(regex) === null) {
//     this.push(item);
//   }
//   next();
// });


module.exports = {
  xmlToJs: xmlToJs,
  skipFile: skipFile,
  xmlBuilder: new xml2js.Builder()
}
