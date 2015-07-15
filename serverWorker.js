(function() {
  'use strict';

  var config          = require('config');
  var restify         = require('restify');
  var mongoose        = require("mongoose");
  var packageJson     = require('./package.json');
  var pictureResource = require('./resource/picture.js');

  var dbConfig = config.get('db');

  /*
   * Set up server
   * @return the created server
   */
  exports.spawn = function spawn(logger) {

    var server = restify.createServer({
      name: packageJson.name,
      version: packageJson.version
    });

    server.use(restify.bodyParser());
    server.use(restify.gzipResponse());
    server.use(restify.authorizationParser());

    server.on('NotFound', function(req, res, next) {
      if (logger) logger.debug('404', 'Request for ' + req.url + ' not found. No route.');
      res.send(404, req.url + ' was not found');
    });

    if (logger) server.on('after', restify.auditLogger({
      log: logger
    }));

    server.get('/:pictureId/:formatName', pictureResource.get);
    server.post('/:template', pictureResource.create);
    server.patch('/:pictureId', pictureResource.update);
    server.del('/:pictureId', pictureResource.remove);

    mongoose.connect(dbConfig.host, function(error) {
      if (error)
        console.error('erro ao conectar mongoDB');
    });

    return server;
  };

}());
