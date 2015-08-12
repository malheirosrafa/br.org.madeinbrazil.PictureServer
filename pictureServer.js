'use strict';

var cluster = require('cluster')
  , config = require('config')
  , logging = require('./logging')
  , serverWorker = require('./serverWorker')

var serverConfig = config.get('server');

function spawnWorker (logger) {
  // create servers
  var server = serverWorker.spawn(logger);

  // start listening
  server.listen(serverConfig.port, function () {
    logger.info('%s listening at %s', server.name, server.url);
  });
}


function createCluster (logger) {

  // Set up cluster and start servers
  if (cluster.isMaster) {
    var numCpus = require('os').cpus().length;

    logger.info('Starting master, pid ' + process.pid + ', spawning ' + numCpus + ' workers');

    // fork workers
    for (var i = 0; i < numCpus; i++) {
      cluster.fork();
    }

    cluster.on('listening', function (worker) {
      logger.info('Worker ' + worker.id + ' started');
    });

    // if a worker dies, respawn
    cluster.on('death', function (worker) {
      logger.warn('Worker ' + worker.id + ' died, restarting...');
      cluster.fork();
    });

  }
  // Worker processes
  else {
    spawnWorker(logger);
  }
}

function run () {

  // Set up logging
  var logger = logging.createLogger();

  if (serverConfig.cluster) {
    createCluster(logger);
  }
  else {
    spawnWorker(logger);
  }
}

run();
