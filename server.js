// A server

function Player(name, socket, connected) {
    this.name = name;
    this.socket = socket;
    this.connected = connected;
}

// Stores all players
var players = {};


exports.run = function(port) {
    var express = require("express");
    var app = express();
    var server = require("http").Server(app);
    var socketio = require("socket.io").listen(server);

    app.use(express.static(__dirname + "/public"));

    server.listen(port);

    socketio.set("log level", 1);
    socketio.on("connection", onConnection);
};

function onConnection(socket) {
    var player = null;

    // Client sends player's name
    socket.on("setname", function(name) {
        if (players.hasOwnProperty(name)) {
            // This is an old player
            player = players[name];
            player.socket = socket;
            player.connected = true;
            console.log("Player reconnected: " + player.name);
        } else {
            // Add a new player
            player = new Player(name, socket, true);
            players[name] = player;
            console.log("New player: " + player.name);
        }
    });

    // Client has disconnected
    socket.on("disconnect", function() {
        if (player !== null) {
            console.log("Player disconnected: " + player.name);
            player.connected = false;
            player = null;
        }
    });
}