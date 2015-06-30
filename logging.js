/*global module:true, require:true */

'use strict';

var fs   = require('fs')
  , path = require('path')
  , bunyan = require('bunyan')
  , pkg    = require('./package.json');


exports.createLogger = createLogger;

/*
 * configure and start logging
 * @return the created logger instance
 */
function createLogger () {

  var appName = pkg.name
    , appVersion = pkg.version
    , logDir =  path.join(__dirname, 'logs')
    , logFile = path.join(logDir, appName + '-log.json')
    , logErrorFile = path.join(logDir, appName + '-errors.json')
    , logLevel = 'info';

  // Create log directory if it doesnt exist
  if (! fs.existsSync(logDir)) fs.mkdirSync(logDir);

  // Log to console and log file
  var log = bunyan.createLogger({
    name: appName
  , streams: [
      {
        stream: process.stdout
      , level: 'warn'
      }
    , {
        path: logFile
      , level: logLevel
      , type: 'rotating-file'
      , period: '1d'
      }
    , {
        path: logErrorFile
      , level: 'error'
      }
    ]
  , serializers: bunyan.stdSerializers
  });

  log.info('Starting ' + appName + ', version ' + appVersion);
  log.info('Environment set to ' + process.env.NODE_ENV);
  log.debug('Logging setup completed.');

  return log;
}
