//require('newrelic');
var express = require('express'),
  http = require('http'),
  path = require('path'),
  hogan = require('hogan-express'),
  util = require('util'),
  app = express(),
  config = require('./config'),
  server = require('http').createServer(app),
  azure = require('azure'),
  io = require('socket.io').listen(server);

var serviceBusService = azure.createServiceBusService(config.sbConnectionString);

var currentSockets = [];

app.configure(function() {
  app.set('port', process.env.PORT || 80);
  app.engine('mustache', hogan);
  app.set('view engine', 'mustache');
  app.set('layout', __dirname + '/views/layout');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Handle 'connection' events
io.sockets.on('connection', function(socket) {
  socket.emit('fromServer', {
    message: 'Connected!  There are now ' + io.sockets.clients().length + ' clients connected.'
  });

  currentSockets.push(socket);

  //setInterval(function() { sendSampleMessage(socket) }, 5000);
  socket.on('message', function(data) {
    socket.emit('message', {
      message: 'I sent: ' + data.message
    });
    socket.broadcast.emit('message', {
      message: data.message
    });
  });

});

server.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

function sendSampleMessage(socket) {
  var msg = sample.getSample();
  socket.emit('fromServer', {
    message: msg
  });
}


function getMessage() {
  if(currentSockets.length > 0) {
    serviceBusService.receiveSubscriptionMessage(config.sbTopic, config.sbSubscription, function(error, receivedMessage) {
      if(!error) {
        for(var i = currentSockets.length - 1; i >= 0; i--) {
          console.log("[" + i + "] writing " + receivedMessage.content );
          currentSockets[i].emit('fromServer', {
            //message: receivedMessage.customProperties
            message: receivedMessage
          });
        };
      } else {
        console.log("Error recieving message");
        console.log(error);
      }

      getMessage();
    });
  } else {
    setTimeout(getMessage, 3000);
  }
}

getMessage();