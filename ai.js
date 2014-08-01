var Heap = require("heap");

// Receives a message from the server
process.on("message", function(data) {
    if ("world" in data) {
        // This message contains world state information
        var action = handleTurn(data);
        process.send(action);
    } else {
        // This message informs about player's death
        handleDeath(data);
    }
});


// The actual AI is implemented below

var state; // Current world state
var targetLocation; // Coordinates of the target tile that the player is trying to reach

// Handles the current turn. Returns an action that the player does in this turn
function handleTurn(data) {
    var action = "";
    state = data;

    console.log("Thinking...");

    if (!targetLocation) {
        targetLocation = getTargetLocation();
    }

    var x = state.coordinates.x;
    var y = state.coordinates.y;

    if (x === targetLocation.x && y === targetLocation.y) {
        // Target location has been reached. Select a new one
        targetLocation = getTargetLocation();
    }

    var dx = targetLocation.x - x;
    var dy = targetLocation.y - y;

    // Get the signs
    var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;

    // Try to get away if the current tile is going to explode
    if (state.world[x][y].turnsToExplosion === 1) {
        if (isSafe(x + sx, y)) {
            action = getDirection(sx, 0);
        } else if (isSafe(x, y + sy)) {
            action = getDirection(0, sy);
        } else if (isSafe(x - sx, y)) {
            action = getDirection(-sx, 0);
        } else if (isSafe(x, y - sy)) {
            action = getDirection(0, -sy);
        } else {
            // The player is going to die. Try to leave a bomb
            action = "BOMB";
        }
    } else {
        // Current tile is safe. Try to move towards the target tile
        if (isSafe(x + sx, y)) {
            action = getDirection(sx, 0);
        } else if (isSafe(x, y + sy)) {
            action = getDirection(0, sy);
        } else {
            // The straight path is blocked
            if (state.bombsAvailable > 0 && !state.world[x][y].turnsToExplosion) {
                // Leave a bomb and select a new target
                action = "BOMB";
                targetLocation = getTargetLocation();
            } else {
                // Try to move away and select a new target
                if (isSafe(x - sx, y)) {
                    action = getDirection(-sx, 0);
                } else if (isSafe(x, y - sy)) {
                    action = getDirection(0, -sy);
                }
                targetLocation = getTargetLocation();
            }
        }
    }

    return action;
}

// Handles death
function handleDeath(data) {
    // Nothing here...
}


// Helper functions are below

// Checks whether a tile is free and not exploding in the next turn
function isSafe(x, y) {
    return state.world[x][y].free && state.world[x][y].turnsToExplosion != 1;
}

// Returns a direction as a string
function getDirection(dx, dy) {
    if (dx < 0 && dy === 0) return "LEFT";
    else if (dx > 0 && dy === 0) return "RIGHT";
    else if (dx === 0 && dy < 0) return "UP";
    else if (dx === 0 && dy > 0) return "DOWN";
    else return "";
}

// Returns a target location for the player
function getTargetLocation() {
    var location;
    var pickupIds = Object.keys(state.pickups);

    // If there are pickups, select one of them as a target with a certain probability
    if (pickupIds.length > 0 && Math.random() < 0.8) {
        // Select the nearest pickup as a target
        var shortest = Infinity;
        for (var i = 0; i < pickupIds.length; ++i) {
            var pickup = state.pickups[pickupIds[i]];

            // Do not select the current pickup again
            if (targetLocation && pickup.coordinates.x === targetLocation.x && pickup.coordinates.y === targetLocation.y) {
                continue;
            }

            // TODO: Replace the squared Euclidean distance with the actual number of tiles needed to reach this pickup
            var dist = Math.pow(state.coordinates.x - pickup.coordinates.x, 2) + Math.pow(state.coordinates.y - pickup.coordinates.y, 2);
            if (dist < shortest) {
                shortest = dist;
                location = pickup.coordinates;
            }
        }
    }

    if (!location) {
        // Select a target location randomly
        do {
            location = {
                x: Math.floor(Math.random() * state.worldWidth),
                y: Math.floor(Math.random() * state.worldHeight)
            };
        } while (location.x === state.coordinates.x && location.y === state.coordinates.y);
    }

    return location;
}

// Returns a shortest path between two tiles
function shortestPath(start, end) {
    if (start.x === end.x && start.y === end.y) {
        return [];
    }

    // Initialize tiles
    for (var i = 0; i < state.worldWidth; ++i) {
        for (var j = 0; j < state.worldHeight; ++j) {
            var tile = state.world[i][j];
            tile.astar = {};
            tile.astar.x = i;
            tile.astar.y = j;
            tile.astar.f = 0;
            tile.astar.g = 0;
            tile.astar.previous = null;
            tile.astar.closed = false;
        }
    }

    var startTile = state.world[start.x][start.y].astar;
    var endTile = state.world[end.x][end.y].astar;

    // Create a heap and add the start tile
    var heap = new Heap(function(a, b) {
        return a.f - b.f;
    });
    heap.push(startTile);

    // The main loop of the algorithm
    while (!heap.empty()) {
        var tile = heap.pop();

        if (tile === endTile) {
            // Target tile has been reached. Retrieve and return the path to it
            var path = [];
            while (tile.previous) {
                path.push({ x: tile.x, y: tile.y });
                tile = tile.previous;
            }
            return path.reverse();
        }

        // Mark this tile as closed
        tile.closed = true;

        // Get the four neighbor tiles
        var neighbors = [state.world[tile.x - 1][tile.y].astar,
                         state.world[tile.x + 1][tile.y].astar,
                         state.world[tile.x][tile.y - 1].astar,
                         state.world[tile.x][tile.y + 1].astar];

        for (var i = 0; i < 4; ++i) {
            var neighbor = neighbors[i];

            // Skip neighbors that are closed ot that are not free
            if (neighbor.closed || !state.world[neighbor.x][neighbor.y].free) {
                continue;
            }

            // Check if the neighbor has been evaluated before
            var evaluated = neighbor.previous != null;

            // Check the distance and Update the neighbor if necessary
            if (!evaluated || tile.g + 1 < neighbor.g) {
                neighbor.previous = tile;
                neighbor.g = tile.g + 1;
                neighbor.f = neighbor.g + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);

                if (!evaluated) {
                    heap.push(neighbor);
                } else {
                    heap.updateItem(neighbor);
                }
            }
        }
    }

    return [];
}
