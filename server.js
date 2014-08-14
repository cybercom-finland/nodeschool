// A server

var TIMEOUT = 5000;
var DELAY = 300;
var PICKUP_PROBABILITY = 0.2;

var timeoutTimer = null;

var Player = require("./player.js");
var Enemy = require("./enemy.js");
var Bomb = require("./bomb.js");

var entityQueue = require("./entityqueue.js");
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

    var enemiesKeys = Object.keys(world.enemies);
    enemiesKeys.forEach(function(enemyKey) {
        var enemy = world.enemies[enemyKey];
        // Add the enemy to a queue
        entityQueue.addEntity(enemy);

        // Send information to the visualizer
        visualizer.addEnemy(enemy.name, enemy.type, enemy.coordinates);
    })
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
            entityQueue.addEntity(player);

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
        }
    });

    // Client sends a response
    socket.on("response", function(response) {
        // Check that the response is sent by a correct player
        if (player === currentEntity && player.turnsToRespawn === 0) {
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
    // Get the next connected entity from the queue
    currentEntity = entityQueue.getConnectedEntity();

    if (currentEntity) {
        ++currentTurn;

        console.log("\nTurn " + currentTurn);
        console.log("Queue: " + entityQueue);

        if (currentEntity instanceof Player) {
            handlePlayerTurn(currentEntity);
        } else if (currentEntity instanceof Enemy) {
            handleEnemyTurn(currentEntity);
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
            "name": player.name,
            "score": player.score,
            "coordinates": player.coordinates,
            "bombsAvailable": player.maxAllowedBombs - player.bombsDropped,
            "bombSize": player.bombSize,
            "bombTimer": player.bombTimer,
            "players": world.getOtherPlayers(player.name),
            "enemies": world.getEnemies(),
            "pickups": world.getPickups(),
            "bombs": world.getBombs(),
            "world": world.getWorldGrid(),
            "worldWidth": world.width,
            "worldHeight": world.height
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

function handleEnemyTurn(enemy) {

    // Move this player to the back of the queue
    entityQueue.moveFirstToBack();

    if (enemy.turnsToRespawn > 0) {
        --enemy.turnsToRespawn;
        if (enemy.turnsToRespawn === 0) {
            enemy.coordinates = world.getStartPointForNewPlayer();
            console.log("Enemy " + enemy + " respawned.");

            // Send information to the visualizer
            visualizer.enemyRespawn(enemy.name, enemy.type, enemy.coordinates);
        }
    } else {
        moveEnemy(enemy);
    }

    // Move to the next player
    nextTurn(DELAY);
}

function handleBombTurn(bomb) {
    // Decrease the bomb timer
    --bomb.timer;

    if (bomb.timer <= 0) {
        console.log("Bomb dropped by a player " + bomb.owner + " exploded!");

        // Results from chained bomb explosions are collected to this array
        var results = [];

        // Explode the bombs
        explodeBomb(bomb.id, results);

        // Handle the destruction caused by the bombs
        results.forEach(function(result) {
            // Go through all killed players
            result.explodingPlayerNames.forEach(function(name) {
                var killedPlayer = killPlayer(name);
                if (killedPlayer) {
                    // Give scores to bomb owner
                    if (killedPlayer !== bomb.owner) {
                        bomb.owner.score += 100;
                    } else {
                        // Negative points if the player explodes itself
                        bomb.owner.score -= 50;
                    }
                }
            });

            // Player gets points also from the destroyed walls
            bomb.owner.score += result.explodingWalls.length * 5;

            // Go through all killed enemies
            result.explodingEnemyNames.forEach(function(name) {
                var killedEnemy = killEnemy(name);
                // Give points
                bomb.owner.score += 50;
            });

            if (bomb.owner.score < 0) {
                bomb.owner.score = 0;
            }

            // Go through all destroyed pickups
            result.explodingPickupIds.forEach(function(id) {
                // Try to remove the pickup.
                // It is possible that some earlier explosion in this bomb chain has already destroyed it
                if (world.removePickup(id)) {
                    visualizer.destroyPickup(id);
                }
            });

            // Go through all destroyed walls
            result.explodingWalls.forEach(function(c) {
                // Make sure that some previously exploded bomb has not already destroyed this wall
                if (world.grid[c.x][c.y].type === "SoftBlock") {
                    world.clearTile(c.x, c.y);

                    // There is a small change that a pickup will appear
                    if (Math.random() < PICKUP_PROBABILITY) {
                        var pickup = world.addPickup(c.x, c.y);
                        visualizer.addPickup(pickup.id, c, pickup.type);
                    }
                }
            });

            // Add new soft blocks if there are not enough left
            var softBlocks = world.getSoftBlockCount();
            if (softBlocks < 150) {
                addSoftBlocks(150 - softBlocks, true);
            }

            // Send information to the visualizer
            visualizer.bombExplosion(result.bombId, result.explodingTiles, result.explodingWalls);
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

function explodeBomb(bombId, results) {
    var bomb = world.bombs[bombId];
    if (!bomb) {
        return;
    }

    // Remove the bomb from the queue
    entityQueue.removeEntity(bomb);
    --bomb.owner.bombsDropped;

    // Explode the bomb and get the result
    var result = world.explodeBomb(bomb);
    results.push(result);

    // Chain the bomb explosions recursively
    result.explodingBombIds.forEach(function(id) {
        explodeBomb(id, results);
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
        entityQueue.addEntity(bomb);

        // Send information to the visualizer
        visualizer.addBomb(bomb.id, bomb.coordinates, bomb.timer);
    }
}

function movePlayer(player, action) {
    var oldCoordinates = {
        "x": player.coordinates.x,
        "y": player.coordinates.y
    };
    // Move the player
    var ok = player.move(action);
    if (!ok) {
        console.log("Player " + player + " is unable to move to that direction.");
    } else {
        var enemyInTile = world.getEnemyByCoordinates(player.coordinates.x, player.coordinates.y);
        if (enemyInTile) {
            console.log("Player " + player + " hits an enemy.")
            // Kill a player if found
            killPlayer(player.name);
        } else {
            var playerInTile = world.getPlayerByCoordinates(player.coordinates.x, player.coordinates.y);
            var bombInTile = world.getBombByCoordinates(player.coordinates.x, player.coordinates.y);
            if (bombInTile || (playerInTile && playerInTile !== player)) {
                if (bombInTile) {
                    console.log("Player " + player + " hits a bomb.");
                } else if (playerInTile && playerInTile !== player) {
                    console.log("Player " + player + " hits another player.");
                }
                // Don't go to the same tile with bomb
                player.coordinates = oldCoordinates;
            } else {
                // Check if the tile has a pickup
                var pickup = world.getPickupByCoordinates(player.coordinates.x, player.coordinates.y);
                if (pickup) {
                    collectPickup(player, pickup);
                }

                // Send information to the visualizer
                visualizer.movePlayer(player.name, player.coordinates);
            }
        }
    }
}

function collectPickup(player, pickup) {
    // Remove the pickup
    world.removePickup(pickup.id);
    visualizer.destroyPickup(pickup.id);

    // Handle different pickup types
    if (pickup.type === "Power") {
        // Increases the explosion size
        console.log("Pickup collected: Power");
        player.bombSize += 1;
    } else if (pickup.type === "Shuffle") {
        // Randomizes the entity queue order
        console.log("Pickup collected: Shuffle");
        entityQueue.shuffle();
    } else if (pickup.type === "Walls") {
        // Adds new walls randomly
        addSoftBlocks(10, false);
    } else {
        console.log("Unknown pickup collected.");
    }

    player.score += 20;
}

// Kill the player
function killPlayer(name) {
    var killedPlayer = world.players[name];

    // Make sure that the player is still alive
    if (killedPlayer.turnsToRespawn === 0) {
        // Player dies
        killedPlayer.coordinates.x = -1;
        killedPlayer.coordinates.y = -1;
        killedPlayer.turnsToRespawn = 5;
        killedPlayer.resetDefaultValues();

        // Emit information to the client
        killedPlayer.socket.emit("death", {
            "turn": currentTurn,
            "score": killedPlayer.score
        });

        visualizer.playerDeath(killedPlayer.name);
        console.log("Player " + killedPlayer + " dies!");
        return killedPlayer;
    }

    return null;
}

function moveEnemy(enemy) {
    var oldCoordinates = {
        "x": enemy.coordinates.x,
        "y": enemy.coordinates.y
    };
    // Move the enemy
    var ok = false;
    if (enemy.type === 1) {
        ok = enemy.moveEnemy1();
    } else {
        ok = enemy.moveEnemy2();
    }
    if (!ok) {
        console.log("Enemy " + enemy + " is unable to move to that direction.");
    } else {
        var enemyInTile = world.getEnemyByCoordinates(enemy.coordinates.x, enemy.coordinates.y);
        if (enemyInTile && enemyInTile !== enemy) {
            // Don't go to the same tile with other enemy
            enemy.coordinates = oldCoordinates;
        } else {
            var playerInTile = world.getPlayerByCoordinates(enemy.coordinates.x, enemy.coordinates.y);
            if (playerInTile) {
                // Kill a player if found
                killPlayer(playerInTile.name);
            }
            var bombInTile = world.getBombByCoordinates(enemy.coordinates.x, enemy.coordinates.y);
            if (bombInTile) {
                // Don't go to the same tile with bomb
                enemy.coordinates = oldCoordinates;
            }
            visualizer.moveEnemy(enemy.name, enemy.type, enemy.coordinates);
        }
    }
}

// Kills the enemy
function killEnemy(name) {
    var killedEnemy = world.enemies[name];

    // Enemy dies
    killedEnemy.coordinates.x = -1;
    killedEnemy.coordinates.y = -1;
    killedEnemy.turnsToRespawn = 5;

    // Send information to the visualizer
    visualizer.enemyDeath(killedEnemy.name);
    console.log("Enemy " + killedEnemy + " dies!");

    return killedEnemy;
}

// Adds new soft blocks
function addSoftBlocks(count, addAll) {
    for (var i = 0; i < count; ++i) {
        var empty = false;
        do {
            var x = Math.floor(Math.random() * (world.width - 2)) + 1;
            var y = Math.floor(Math.random() * (world.height - 2)) + 1;

            // Add soft blocks only to the empty tiles
            empty = world.isEmpty(x, y);
            if (empty) {
                world.addSoftBlock(x, y);
                visualizer.addSoftBlock(x, y);
            }
        } while (!empty && addAll)
    }
}
