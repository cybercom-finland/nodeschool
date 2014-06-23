// A server

var TIMEOUT = 5000;
var DELAY = 500;

var timeoutTimer = null;

var Player = require("./player.js");
var Bomb = require("./bomb.js");

var entityQueue = require("./playerqueue.js");
var currentEntity = null;
var currentTurn = 0;
var activePlayers = false;

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
            entityQueue.addPlayer(player);

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

        if (!activePlayers) {
            // Give the turn to a newly added player because it is the only active one in the queue
            activePlayers = true;
            nextTurn(0);
        } else {
            // Tell the world state with null turn,
            // if not yet the turn of the (re)connected player
            var state = {
                "turn": null,
                "score": player.score,
                "coordinates": player.coordinates,
                "enemies": world.getEnemies(player.name),
                "bombs": world.getBombs(),
                "world": world.grid
            }
            player.socket.emit("state", state);
        }
    });

    // Client sends a response
    socket.on("response", function(response) {
        // Check that the response is sent by a correct player and at a correct turn
        if (player === currentEntity && response.turn === currentTurn) {
            // Stop the timeout timer
            clearTimeout(timeoutTimer);
            timeoutTimer = null;

            // Handle the response
            handleResponse(response);

            // Move to the next player
            nextTurn(DELAY);
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
            if (player === currentEntity) {
                currentEntity = null;

                // Clear the timeout timer and move to the next player
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
                nextTurn(0);
            }

            player = null;
        }

        visualizer.removeWatcher(socket);
    });
}

// Called when the player does not respond in time
function onTimeout() {
    console.log("Timeout: " + currentEntity.name);

    // Inform the client about the timeout
    currentEntity.socket.emit("timeout");

    // Move to the next player
    nextTurn(0);
}

// Starts the next turn after a small delay
function nextTurn(delay) {
    currentEntity = null;
    setTimeout(startNextTurn, delay);
}

// Moves the turn to the next connected player
function startNextTurn() {
    // Get the next connected player from the queue
    currentEntity = entityQueue.getConnectedPlayer();

    if (currentEntity) {
        ++currentTurn;

        console.log("\nTurn " + currentTurn);
        console.log("Queue: " + entityQueue);

        if (currentEntity instanceof Player) {
            handlePlayerTurn(currentEntity);
        } else if (currentEntity instanceof Bomb) {
            handleBombTurn(currentEntity);
        }
    } else {
        // There are no connected players
        timeoutTimer = null;
        activePlayers = false;
    }
}

function handlePlayerTurn(player) {
    // Check whether the player is alive or not
    if (player.turnsToRespawn === 0) {
        // State contains the current turn and current world
        var state = {
            "turn": currentTurn,
            "score": player.score,
            "coordinates": player.coordinates,
            "enemies": world.getEnemies(player.name),
            "bombs": world.getBombs(),
            "world": world.grid
        };

        // Emit the current world state
        player.socket.emit("state", state);

        // Move this player to the back of the queue
        entityQueue.moveFirstToBack();

        // Wait for the answer
        timeoutTimer = setTimeout(onTimeout, TIMEOUT);
    } else {
        --player.turnsToRespawn;

        if (player.turnsToRespawn === 0) {
            player.coordinates = world.getStartPointForNewPlayer();
            console.log("Player " + player + " respawned.");

            // Send information to the visualizer
            visualizer.playerRespawn(player.name);
        }

        // Move this player to the back of the queue
        entityQueue.moveFirstToBack();

        // Move to the next player
        nextTurn(DELAY);
    }
}

function handleBombTurn(bomb) {
    // Decrease the bomb timer
    --bomb.timer;

    if (bomb.timer <= 0) {
        console.log("Bomb dropped by a player " + bomb.owner + " exploded!");

        // Remove the bomb from the queue
        entityQueue.removeFirst();
        --bomb.owner.bombsDropped;

        var result = world.explodeBomb(bomb);

        result.explodingPlayers.forEach(function(player) {
            if (player === bomb.owner) {
                bomb.owner.score -= 50;
            } else {
                bomb.owner.score += 100;
            }

            // Player dies
            player.coordinates.x = -1;
            player.coordinates.y = -1;
            player.turnsToRespawn = 5;
            console.log("Player " + player + " dies!");

            // Send information to the visualizer
            visualizer.playerDeath(player.name);
        });
        bomb.owner.score += result.explodingWalls.length * 10;
    } else {
        // Move the bomb to the back of the queue
        entityQueue.moveFirstToBack();

        // Send information to the visualizer
        visualizer.updateBomb(bomb.id, bomb.coordinates, bomb.timer);
    }

    // Move to the next entity
    nextTurn(DELAY);
}

// Handles the response received from the current player
function handleResponse(response) {
    console.log("Player " + currentEntity.name + " action: " + response.action);

    if (response.action === "BOMB") {
        addBomb(currentEntity);
    } else {
        movePlayer(currentEntity, response.action);
    }
}

function addBomb(player) {
    if (player.bombsDropped >= player.maxAllowedBombs) {
        console.log("Player " + player + " has already dropped a maximum number of bombs.");
    } else if (world.getBombByCoordinates(player.coordinates.x, player.coordinates.y) !== null) {
        console.log("The tile already has a bomb.");
    } else {
        // Create a new bomb
        var bomb = world.addBomb(player);
        ++player.bombsDropped;

        // Add the bomb to a queue
        entityQueue.addPlayer(bomb);

        // Send information to the visualizer
        visualizer.addBomb(bomb.id, bomb.coordinates, bomb.timer);
    }
}

function movePlayer(player, action) {
    // Move the player
    var ok = player.move(action);
    if (!ok) {
        console.log("Player " + player + " is unable to move to that direction.");
    } else {
        // Send information to the visualizer
        visualizer.movePlayer(player.name, player.coordinates);
    }
}
