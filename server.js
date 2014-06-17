// A server

var TIMEOUT = 5000;

var timeoutTimer = null;

var Player = require("./player.js");
var Bomb = require("./bomb.js");

var playerQueue = require("./playerqueue.js");
var currentPlayer = null;
var currentTurn = 0;

var World = require("./world.js");
var world = null;

var visualizer = require("./visualizer.js");

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
    world = new World();
};

function onConnection(socket) {
    var player = null;

    // Client wants to visualize the game
    socket.on("startvisualization", function() {
        // Send the world state and players
        visualizer.addWatcher(socket, world);
    });

    // Client sends player's name
    socket.on("setname", function(name) {
        player = world.getPlayer(name);

        if (!player) {
            // Add a new player
            player = world.addPlayer(name, socket);
            console.log("New player: " + player.name);

            // Add the player to a queue
            playerQueue.addPlayer(player);

            // Send information to the visualizer
            visualizer.addPlayer(player.name, player.coordinates);
        } else {
            // This is an old player.
            // Do not allow multiple connections with a same name
            if (player.connected) {
                player.socket.disconnect();
            }

            player.socket = socket;
            player.connected = true;
            console.log("Player reconnected: " + player.name);
        }

        if (timeoutTimer === null) {
            nextTurn();
        } else {
            // Tell the world state with null turn,
            // if not yet the turn of the (re)connected player
            var state = {
                "turn": null,
                "coordinates": player.coordinates,
                "enemies": world.getEnemies(player.name),
                "world": world.grid
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

        visualizer.removeWatcher(socket);
    });
}

// Called when the player does not respond in time
function onTimeout() {
    console.log("Timeout: " + currentPlayer.name);

    // Inform the client about the timeout
    currentPlayer.socket.emit("timeout");

    // Move to the next player
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

        if (currentPlayer instanceof Player) {
            // State contains the current turn and current world
            var state = {
                "turn": currentTurn,
                "coordinates": currentPlayer.coordinates,
                "enemies": world.getEnemies(currentPlayer.name),
                "world": world.grid
            };

            // Emit the current world state
            currentPlayer.socket.emit("state", state);

            // Move this player to the back of the queue
            playerQueue.moveFirstToBack();

            // Wait for the answer
            timeoutTimer = setTimeout(onTimeout, TIMEOUT);

        } else if (currentPlayer instanceof Bomb) {
            // Decrease the bomb timer
            --currentPlayer.timer;
            if (currentPlayer.timer <= 0) {
                // Remove the bomb from the queue
                playerQueue.removeFirst();

                console.log("Bomb exploded!");
            } else {
                // Move the bomb to the back of the queue
                playerQueue.moveFirstToBack();
            }

            // Move to the next entity
            nextTurn();
        }
    } else {
        // There are no connected players
        timeoutTimer = null;
    }
}

// Handles the response received from the current player
function handleResponse(response) {
    console.log("Player " + currentPlayer.name + " action: " + response.action);

    if (response.action === "BOMB") {
        // Create a new bomb
        var bomb = world.addBomb(currentPlayer.coordinates.x, currentPlayer.coordinates.y, 5);

        // Add the bomb to a queue
        playerQueue.addPlayer(bomb);
    } else {
        // Move the player
        var newTileType = currentPlayer.move(response.action);
        if (newTileType === null) {
            console.log("Player " + currentPlayer.name + " is unable to move to that direction.");
        } else {
            // Send information to the visualizer
            visualizer.movePlayer(currentPlayer.name, currentPlayer.coordinates);
        }
    }
}
