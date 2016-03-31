'use strict'

var xml2js = require('xml2js');
var through2 = require('through2');

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
    if (!item.stats.isDirectory()) {
      this.push(item);
    }
    next();
});

module.exports = {
  xmlToJs: xmlToJs,
  skipFile: skipFile,
  xmlBuilder: new xml2js.Builder()
}
