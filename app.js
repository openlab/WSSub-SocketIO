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

        if(error) {
            console.error(error);
            return;
        }

        console.log('Message received -->');

        var msg = receivedMessage;
        //console.log(msg);
        //var msgjson = JSON.parse(msg);
        //var msgbody = msgjson.body;
        msgbody = msg.body;
        //console.log("CORY IS AWESOME !");
        //console.log(msgbody);

        var copy = new Buffer(msgbody);
        console.log(copy);

        wss.on('connection', function(ws) {
            console.log(' ');
            console.log('sending message...');
            ws.send(copy);
            console.log('message sent');
        });
    

    });
}, 5);