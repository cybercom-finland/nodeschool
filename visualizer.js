var watchers = [];

exports.addWatcher = function(socket, world) {
    // Save the socket to the array
    watchers.push(socket);
    console.log("Watcher added.");

    // Send the current state of the game
    socket.emit("worldstate", world.grid);
    Object.keys(world.players).forEach(function(name) {
        socket.emit("addplayer", name, world.players[name].coordinates);
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
