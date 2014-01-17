var azure = require('azure');
var program = require('commander');
var config = require('./config');
var socketio = require('socket.io');
var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({port: 8080});
var sbService = azure.createServiceBusService(config.sbConnectionString);

program
    .version('0.0.1')
    .parse(process.argv);

var loop = setInterval(function() {
    sbService.receiveSubscriptionMessage(config.sbTopic, config.sbSubscription, function(error, receivedMessage) {

        console.log('Message received');

        wss.on('connection', function(ws) {
            console.log('sending message...');
            ws.send(receivedMessage.body);
            console.log('message sent');
        });
    
        if(error) {
            console.error(error);
        }
    });
}, 5);