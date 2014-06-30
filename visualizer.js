var Player = require("./player.js");
var Enemy = require("./enemy.js");
var Bomb = require("./bomb.js");

var watchers = [];

exports.addWatcher = function(socket, world) {
    // Save the socket to the array
    watchers.push(socket);
    console.log("Watcher added.");

    // Send the current state of the game
    socket.emit("worldstate", world.grid);
    Object.keys(world.enemies).forEach(function(name) {
        socket.emit("addenemy", name, world.enemies[name].type, world.enemies[name].coordinates);
    });
    Object.keys(world.players).forEach(function(name) {
        socket.emit("addplayer", name, world.players[name].coordinates);
    });

    Object.keys(world.bombs).forEach(function(id) {
        socket.emit("addbomb", id, world.bombs[id].coordinates, world.bombs[id].timer);
    });

    Object.keys(world.pickups).forEach(function(id) {
        socket.emit("addpickup", id, world.pickups[id].coordinates, world.pickups[id].type);
    });
};

exports.removeWatcher = function(socket) {
    // Go through all sockets
    for (var i = 0; i < watchers.length; ++i) {
        if (watchers[i] === socket) {
            // Remove the socket from the array
            watchers.splice(i, 1);
            console.log("Watcher removed.");
        }
    }
};

// Sends the world state to visualizers
exports.updateWorldState = function(state) {
    watchers.forEach(function(socket) {
        socket.emit("worldstate", state);
    });
};

// Sends information about a new player to visualizers
exports.addPlayer = function(name, coords) {
    watchers.forEach(function(socket) {
        socket.emit("addplayer", name, coords);
    });
}

// Sends information about a player movement to visualizers
exports.movePlayer = function(name, coords) {
    watchers.forEach(function(socket) {
        socket.emit("moveplayer", name, coords);
    });
};

// Sends information about a new enemy to visualizers
exports.addEnemy = function(name, type, coords) {
    watchers.forEach(function(socket) {
        socket.emit("addenemy", name, type, coords);
    });
}

// Sends information about a player movement to visualizers
exports.moveEnemy = function(name, type, coords) {
    watchers.forEach(function(socket) {
        socket.emit("moveenemy", name, type, coords);
    });
};

// Sends information about a new bomb to visualizers
exports.addBomb = function(id, coords, timer) {
    watchers.forEach(function(socket) {
        socket.emit("addbomb", id, coords, timer);
    });
}

// Sends information about an updated bomb to visualizers
exports.updateBomb = function(id, coords, timer) {
    watchers.forEach(function(socket) {
        socket.emit("updatebomb", id, coords, timer);
    });
}

// Sends information about an exploded bomb to visualizers
exports.bombExplosion = function(id, explodingTiles, explodingWalls) {
    watchers.forEach(function(socket) {
        socket.emit("bombexplosion", id, explodingTiles, explodingWalls);
    });
}

// Sends information about player death to visualizers
exports.playerDeath = function(name) {
    watchers.forEach(function(socket) {
        socket.emit("playerdeath", name);
    });
}

// Sends information about player rebirth to visualizers
exports.playerRespawn = function(name, coords) {
    watchers.forEach(function(socket) {
        socket.emit("playerrespawn", name, coords);
    });
}

// Sends information about a disconnected player to visualizers
exports.playerDisconnect = function(name) {
    watchers.forEach(function(socket) {
        socket.emit("playerdisconnect", name);
    });
}

// Sends information about player death to visualizers
exports.enemyDeath = function(name, type) {
    watchers.forEach(function(socket) {
        socket.emit("enemydeath", name, type);
    });
}

// Sends information about player rebirth to visualizers
exports.enemyRespawn = function(name, type, coords) {
    watchers.forEach(function(socket) {
        socket.emit("enemyrespawn", name, type, coords);
    });
}

// Send the entity queue to visualizers
exports.entityQueue = function(queue) {
    var data = [];
    queue.forEach(function(entity) {
        if (entity.connected) {
            if (entity instanceof Player) {
                data.push({
                    type: "Player",
                    name: entity.name,
                    score: entity.score,
                    active: entity.connected && entity.turnsToRespawn === 0
                });
            } else if (entity instanceof Enemy) {
                data.push({
                    type: "Enemy",
                    name: entity.name,
                    enemyType: entity.type,
                    active: entity.connected && entity.turnsToRespawn === 0
                });
            } else if (entity instanceof Bomb) {
                data.push({
                    type: "Bomb",
                    id: entity.id,
                    timer: entity.timer
                });
            }
        }
    });

    watchers.forEach(function(socket) {
        socket.emit("entityqueue", data);
    });
}

// Sends information about a new pickup to visualizers
exports.addPickup = function(id, coords, type) {
    watchers.forEach(function(socket) {
        socket.emit("addpickup", id, coords, type);
    });
}

// Sends information about a destroyed pickup to visualizers
exports.destroyPickup = function(id) {
    watchers.forEach(function(socket) {
        socket.emit("destroypickup", id);
    });
}

