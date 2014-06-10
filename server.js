// A server

var TIMEOUT = 5000;

// World size as tiles (not pixels)
var HEIGHT = 30;
var WIDTH = 60;

function Player(name, socket, connected) {
    this.name = name;
    this.socket = socket;
    this.connected = connected;
}

// Stores all players
var players = {};

var playerQueue = require("./playerqueue.js");
var currentPlayer = null;
var currentTurn = 0;

var timeoutTimer = null;

var world = null;

// Constructor for World object
//
// Initial list of basic characters that can be used demonstrating the world,
// before graphics library is taken into use:
//
//  - '#': Block
//  - ' ': Open space
//  - 'X': Wall
//  - 'O': Bomb
//  - '?': Pickup
//  - '!': Enemy
//  - <n>: Player <n>
//
//  TODO: This is only an initial world state for easy textual visualization.
//  To be designed and developped further to support real functionality,
//  e.g. bombs need timers, players need names and pickup items need details

function World(width, height) {
    this.width = width;
    this.height = height;
    console.log("Creating world with " + width + "x" + height + " tiles");

    this.state = new Array(height);
    for (var i = 0; i < height; i++) {
        this.state[i] = new Array(width);
        for (var j = 0; j < width; j++) {
            // Initialize the world with borders
            if (i === 0 || j === 0 || i === height - 1 || j === width - 1) {
                this.state[i][j] = "#";
            } else {
                this.state[i][j] = " ";
            }
        }
    }
}

exports.run = function(port) {
    var express = require("express");
    var app = express();
    var server = require("http").Server(app);
    var socketio = require("socket.io").listen(server);

    app.use(express.static(__dirname + "/public"));

    server.listen(port);

    socketio.set("log level", 1);
    socketio.on("connection", onConnection);

    // Create a new world
    world = new World(WIDTH, HEIGHT);
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

        if (timeoutTimer === null) {
            nextTurn();
        } else {
            // Tell the world state with null turn,
            // if not yet the turn of the (re)connected player
            var state = {
                "turn": null,
                "world": world.state
            }
            player.socket.emit("state", state);

        }
    });

    // Client sends a response
    socket.on("response", function(response) {
        // Check that the response is sent by a correct player and at a correct turn
        if (player === currentPlayer && response.turn === currentTurn) {
            console.log("Player " + player.name + " sent a response.");

            // Stop the timeout timer
            clearTimeout(timeoutTimer);
            timeoutTimer = null;

            // Handle the response
            handleResponse(response);

            // Move to the next player
            nextTurn();
        } else {
            // Ignore wrong responses
            console.log("Player " + player.name + " sent a response at a wrong turn.");
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

                // Clear the timeout timer and move to the next player
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
                nextTurn();
            }

            player = null;
        }
    });
}

// Called when the player does not respond in time
function onTimeout() {
    console.log("Timeout: " + currentPlayer.name);
    nextTurn();
}

// Moves the turn to the next connected player
function nextTurn() {
    // Get the next connected player from the queue
    currentPlayer = playerQueue.getConnectedPlayer();

    if (currentPlayer) {
        ++currentTurn;

        console.log("\nTurn " + currentTurn);
        console.log("Queue: " + playerQueue);

        // State contains the current turn and current world
        var state = {
            "turn": currentTurn,
            "world": world.state
        };

        // Emit the current world state
        currentPlayer.socket.emit("state", state);

        // Move this player to the back of the queue
        playerQueue.moveFirstToBack();

        // Wait for the answer
        timeoutTimer = setTimeout(onTimeout, TIMEOUT);
    } else {
        // There are no connected players
        timeoutTimer = null;
    }
}

// Handles the response received from the current player
function handleResponse(response) {
    console.log("Player " + currentPlayer.name + " action: " + response.action);
}
