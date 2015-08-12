(function() {
  'use strict';

  var fs      = require('fs');
  var gm      = require('gm');
  var config  = require('config');
  var restify = require('restify');
  var Picture = require('../model/picture');

  var picturesConfig = config.get('pictureTemplates');


  exports.get = function get(req, res, next) {

    var pictureFormat = req.params.formatName,
      pictureId = req.params.pictureId;

    var onPictureBufferReady = function onPictureBufferReady(error, buffer) {
      if (error) return next(new restify.InternalServerError(error));

      res.writeHead(200, {
        'Content-Type': 'image/jpg'
      });
      res.end(buffer, 'binary');
      return next();
    };

    var onPictureDocumentFound = function onPictureFound(error, picture) {

      if (error) return next(new restify.InternalServerError(error));
      if (!picture) return next(new restify.NotFoundError());

      var cfg = picturesConfig[picture.template].formats[pictureFormat];

      if (!cfg) return next(new restify.BadRequestError('%s is not a valid format', pictureFormat));

      var img = gm(picture.data, pictureId)
        .resize(cfg.width, cfg.height, cfg.options);

      if (cfg.crop)
        img
        .gravity(cfg.gravity)
        .crop(cfg.width, cfg.height);

      img.quality(cfg.quality)
        .autoOrient()
        .noProfile()
        .toBuffer('JPG', onPictureBufferReady);
    };


    try {
      Picture.findById(pictureId, onPictureDocumentFound);
    } catch (e) {
      return next(new restify.NotFoundError());
    }
  };


  exports.create = function create(req, res, next) {
    //console.log(req.files.picture);

    var type = req.files.picture.type;

    fs.readFile(req.files.picture.path, function(err, data) {

      var pic = new Picture({
        template: req.params.template,
        data: data
      });
      pic.save();

      var picCreated = {
        id: pic._id
      };

      res.send(picCreated);
      next();
    });
  };


  exports.update = function update(req, res, next) {

    var pictureDataReady = false,
      pictureDocumentReady = false,
      pictureDocument = null,
      pictureData = null;

    var pictureId = req.params.pictureId;


    var updatePictureData = function updatePictureData() {
      if(!pictureDataReady || !pictureDataReady)
        return;

        pictureDocument.data = pictureData;
        pictureDocument.save();

        var picUpdated = {
          id: pictureDocument._id
        };

        res.send(picUpdated);
        next();
	
	/*
   	 * Codigo-fonte retirado de https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html
    	 * com algumas adaptacoes
     	 */
	
	//Envia o id da imagem para o servidor RabbitMQ
	var amqp = require('amqplib/callback_api');

        amqp.connect('amqp://mqadmin:EmbelezApp2015@queue.embelezapp.com.br', function(err, conn) {
            conn.createChannel(function(err, ch) {
		var ex = 'exchange';		
		var msg = pictureId;		

		ch.assertExchange(ex, 'fanout', {durable: false});		
		ch.publish(ex, '', new Buffer(msg));
                
                console.log(" [x] Sent "+msg);
            });

            setTimeout(function() { conn.close(); process.exit(0) }, 500);
        });
	/**********************************************************************************************/	

    };

    var onPictureFileReady = function onPictureFileReady(error, data) {
      //error = 'aqui';
      if (error) return next(new restify.InternalServerError(error));

      pictureData = data;
      pictureDataReady = true;
      updatePictureData();
    };

    var onPictureDocumentFound = function onPictureDocumentFound(error, picture) {

      if (error) return next(new restify.InternalServerError(error));
      if (!picture) return next(new restify.NotFoundError());

      pictureDocument = picture;
      pictureDocumentReady = true;
      updatePictureData();
    };


    try {
      Picture.findById(pictureId, onPictureDocumentFound);
      fs.readFile(req.files.picture.path, onPictureFileReady);
    } catch (e) {
      return next(new restify.NotFoundError('ndjsad'));
    }
  };

  exports.remove = function remove(req, res, next) {
      var pictureId = req.params.pictureId;

      var onPictureDocumentRemoved = function onPictureDocumentRemoved(error, picture) {
        if (error) return next(new restify.InternalServerError(error));
        
        res.send();
        return next();
      };


      try {
        Picture.findByIdAndRemove({_id: pictureId}, onPictureDocumentRemoved);
      } catch (e) {
        return next(new restify.NotFoundError());
      }
  };


}());
