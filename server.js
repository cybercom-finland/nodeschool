// A server

var TIMEOUT = 5000;

function Player(name, socket, connected) {
    this.name = name;
    this.socket = socket;
    this.connected = connected;
}

// Stores all players
var players = {};
var currentPlayer = null;

var playerQueue = require("./playerqueue.js");
var timer = null;
var turnCounter = 0;


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

            // Do not allow multiple connections with a same name
            if (player.connected) {
                player.socket.disconnect();
            }

            player.socket = socket;
            player.connected = true;
            console.log("Player reconnected: " + player.name);
        } else {
            // Add a new player
            player = new Player(name, socket, true);
            players[name] = player;
            console.log("New player: " + player.name);

            // Add the player to a queue
            playerQueue.addPlayer(player);
        }

        if (timer === null) {
            nextTurn();
        }
    });

    // Client has disconnected
    socket.on("disconnect", function() {
        if (player !== null) {
            console.log("Player disconnected: " + player.name);
            player.connected = false;

            // Check whether this was a player whose turn it is
            if (player === currentPlayer) {
                currentPlayer = null;

                // Clear timer and move to a next player
                clearTimeout(timer);
                timer = null;
                nextTurn();
            }

            player = null;
        }
    });
}

function nextTurn() {
    // Get the next connected player from the queue
    currentPlayer = playerQueue.getConnectedPlayer();

    if (currentPlayer) {
        ++turnCounter;

        console.log("Turn " + turnCounter);
        playerQueue.print();

        // Emit the current world state
        currentPlayer.socket.emit("state", { "turn": turnCounter });

        // Move this player to the back of the queue
        playerQueue.moveFirstToBack();

        // Wait for the answer
        timer = setTimeout(nextTurn, TIMEOUT);
    } else {
        // There are no connected players
        timer = null;
    }
}
