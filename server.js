// A server

var TIMEOUT = 5000;
var DELAY = 500;
var PICKUP_PROBABILITY = 0.2;

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
            nextTurn(DELAY);
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
                nextTurn(DELAY);
            }

            visualizer.playerDisconnect(player.name);

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
    nextTurn(DELAY);
}

// Starts the next turn after a small delay
function nextTurn(delay) {
    // Send the queue to the visualizers
    visualizer.entityQueue(entityQueue.getQueue());

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
            visualizer.playerRespawn(player.name, player.coordinates);
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

        var pickupCoords = [];

        // The owner of this bomb will get all points from the following chained bomb explosions
        explodeBomb(bomb.id, bomb.owner, pickupCoords);

        // Add new pickups
        pickupCoords.forEach(function(c) {
            var pickup = world.addPickup(c.x, c.y);
            visualizer.addPickup(pickup.id, c, pickup.type);
        });

        // Move to the next entity
        nextTurn(DELAY);
    } else {
        // Move the bomb to the back of the queue
        entityQueue.moveFirstToBack();

        // Send information to the visualizer
        visualizer.updateBomb(bomb.id, bomb.coordinates, bomb.timer);

        // Move to the next entity
        nextTurn(DELAY);
    }
}

function explodeBomb(bombId, player, pickupCoords) {
    var bomb = world.bombs[bombId];
    if (!bomb) {
        return;
    }

    // Remove the bomb from the queue
    entityQueue.removePlayer(bomb);
    --bomb.owner.bombsDropped;

    // Explode the bomb and get the result
    var result = world.explodeBomb(bomb);

    // Go through all killed players
    result.explodingPlayerNames.forEach(function(name) {
        var killedPlayer = world.players[name];

        if (killedPlayer === player) {
            player.score -= 50;
        } else {
            player.score += 100;
        }

        // Player dies
        killedPlayer.coordinates.x = -1;
        killedPlayer.coordinates.y = -1;
        killedPlayer.turnsToRespawn = 5;
        console.log("Player " + killedPlayer + " dies!");

        // Send information to the visualizer
        visualizer.playerDeath(killedPlayer.name);
    });
    player.score += result.explodingWalls.length * 10;

    // Go through all destroyed pickups
    result.explodingPickupIds.forEach(function(id) {
        delete world.pickups[id];
        visualizer.destroyPickup(id);
    });

    // Go through all destroyed walls
    result.explodingWalls.forEach(function(c) {
        // For each wall there is a small change that a pickup will appear.
        // The coordinates of new pickups are collected to an array and they
        // are added after all chained bombs have exploded.
        if (Math.random() < PICKUP_PROBABILITY) {
            pickupCoords.push(c);
        }
    });

    // Send information to the visualizer
    visualizer.bombExplosion(bombId, result.explodingTiles, result.explodingWalls);

    // Chain the bomb explosions
    result.explodingBombIds.forEach(function(b) {
        explodeBomb(b, player, pickupCoords);
    });
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
