// The actual AI should be implemented in this file.
//
// In each turn, the function "handleTurn" is called. It should decide what the player character does and
// return a string that represents the action. Possible actions are UP, DOWN, RIGHT, LEFT and BOMB.
// The first four of them will move the character to a corresponding direction. The last one
// will drop a bomb to a current tile. Only one action can be returned in a single turn.
// The function must return an action within 5 seconds.
//
// The function "handleDeath" is called when the player dies. It is called just to inform the AI and
// should not return any actions. When the player character respawns, the function "handleTurn" is
// called.
//
// The variable "state" contains the current state of the game world:
//
// state.turn               Number
// state.name               String
// state.score              Number
// state.coordinates.x      Number
// state.coordinates.y      Number
// state.bombsAvailable     Number
// state.bombSize           Number
// state.bombTimer          Number
// state.worldWidth         Integer
// state.worldHeight        Integer

// The following four items are associative arrays:
// state.players            Key: player name. Value: { coordinates, score }
// state.enemies            Key: enemy name.  Value: { coordinates }
// state.pickups            Key: pickup id.   Value: { coordinates, type }
// state.bombs              Key: bomb id.     Value: { coordinates, timer, size }

// state.world is a two-dimensional array of tiles (state.worldWidth x state.worldHeight). Each tile contains the following information:
// tile.hardBlock           Boolean, true if the tile contains a hard block
// tile.softBlock           Boolean, true if the tile contains a soft block
// tile.playerName          The name of the human player that is in this tile. If there is no player, the value is null.
// tile.enemyName           The name of the computer-controlled enemy that is in this tile. If there is no enemy, the value is null.
// tile.pickupId            The id of the pickup that is in this tile. If there is no pickup, the value is null.
// tile.bombId              The id of the bomb that is in this tile. If there is no bomb, the value is null.
// tile.turnsToExplosion    The number of turns left until some bomb causes this tile to explode. The value is 0, if the tile is not going to explode.



///////////////////////////////////////////////////////////////////////////////
// The following functions should be modified to implement the AI.           //
///////////////////////////////////////////////////////////////////////////////

var targetLocation; // Coordinates of the target tile that the player is trying to reach

function handleTurn() {
    var action = "";

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

    var path = shortestPath(state.coordinates, targetLocation);
    if (path.length > 0) {
        dx = path[0].x - x;
        dy = path[0].y - y;
    }

    // Get the signs
    var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    if (sx != 0 && sy != 0) if (Math.random() < 0.5) sx = 0; else sy = 0;

    // Try to get away if the current tile is going to explode
    if (state.world[x][y].turnsToExplosion === 1) {
        if (isSafe(x + 1, y)) {
            action = getDirection(1, 0);
        } else if (isSafe(x, y + 1)) {
            action = getDirection(0, 1);
        } else if (isSafe(x - 1, y)) {
            action = getDirection(-1, 0);
        } else if (isSafe(x, y - 1)) {
            action = getDirection(0, -1);
        } else {
            // The player is going to die. Try to leave a bomb
            action = "BOMB";
        }
    } else {
        if (state.world[x][y].bombId != null) {
            // Move to a direction that has the largest number of free tiles
            var r = calculateEmptyTiles(x, y);
            if (r.largest === "UP") {
                sx = 0;
                sy = -1;
            }
            if (r.largest === "DOWN") {
                sx = 0;
                sy = 1;
            }
            if (r.largest === "RIGHT") {
                sx = 1;
                sy = 0;
            }
            if (r.largest === "LEFT") {
                sx = -1;
                sy = 0;
            }
        }

        // Current tile is safe. Try to move towards the target tile
        if (isSafe(x + sx, y + sy)) {
            action = getDirection(sx, sy);
        } else {
            // The straight path is blocked
            if (state.bombsAvailable > 0 && !state.world[x][y].turnsToExplosion) {
                // Leave a bomb and select a new target
                action = "BOMB";
                targetLocation = getTargetLocation();
            } else {
                // Try to move away and select a new target
                if (isSafe(x + 1, y)) {
                    action = getDirection(1, 0);
                } else if (isSafe(x, y + 1)) {
                    action = getDirection(0, 1);
                } else if (isSafe(x - 1, y)) {
                    action = getDirection(-1, 0);
                } else if (isSafe(x, y - 1)) {
                    action = getDirection(0, -1);
                }
                targetLocation = getTargetLocation();
            }
        }
    }

    return action;
}

// Handles death
function handleDeath() {
    // Nothing here...
}



///////////////////////////////////////////////////////////////////////////////
// Helper functions are below.                                               //
// These can be freely modified.                                             //
///////////////////////////////////////////////////////////////////////////////

// Calculates how many empty tiles there are in different directions
function calculateEmptyTiles(x, y) {
    var width = state.worldWidth;
    var height = state.worldHeight;

    function checkTile(x, y) {
        var res = 0;
        var queue = [];
        var visited = new Array(width * height);
        for (var i = 0; i < visited.length; ++i) {
            visited[i] = false;
        }

        queue.push({ x: x, y: y });
        while (queue.length > 0) {
            var c = queue.pop();
            visited[c.y * width + c.x] = true;

            if (isFree(c.x, c.y)) {
                if (!visited[c.y * width + c.x - 1]) {
                    queue.push({ x: c.x - 1, y: c.y });
                }
                if (!visited[c.y * width + c.x + 1]) {
                    queue.push({ x: c.x + 1, y: c.y });
                }
                if (!visited[(c.y - 1) * width + c.x]) {
                    queue.push({ x: c.x, y: c.y - 1});
                }
                if (!visited[(c.y + 1) * width + c.x]) {
                    queue.push({ x: c.x, y: c.y + 1 });
                }

                ++res;
            }
        }

        return res;
    }

    var sizes = [
        checkTile(x, y - 1),
        checkTile(x, y + 1),
        checkTile(x + 1, y),
        checkTile(x - 1, y)
    ];
    var largest = sizes.indexOf(Math.max.apply(null, sizes));

    // Returns the number of empty tiles in different directions and the largest direction as a string
    return {
        up: sizes[0],
        down: sizes[1],
        right: sizes[2],
        left: sizes[3],
        largest: largest === 0 ? "UP" : largest === 1 ? "DOWN" : largest === 2 ? "RIGHT" : "LEFT"
    };
}

// Checks whether the coordinates are inside the game area
function isInside(x, y) {
    return !(x < 1 || x > state.worldWidth - 2 || y < 1 || y > state.worldHeight - 2);
}

// Checks whether a tile is free i.e. does not contain walls, players, enemies or bombs
function isFree(x, y) {
    if (!isInside(x, y)) {
        return false;
    }

    var tile = state.world[x][y];
    return tile.playerName === null &&
           tile.enemyName === null &&
           tile.bombId === null &&
           !tile.hardBlock &&
           !tile.softBlock;
}

// Checks whether an enemy is in neighbor tiles
function isEnemyNearby(x, y) {
    if (!isInside(x, y)) {
        return false;
    }

    return !(state.world[x - 1][y].enemyName === null &&
             state.world[x + 1][y].enemyName === null &&
             state.world[x][y - 1].enemyName === null &&
             state.world[x][y + 1].enemyName === null);
}

// Checks whether a tile is free and safe for the next turn i.e. there are no enemies in the neighbor tiles and the tile is not going to explode
function isSafe(x, y) {
    if (!isInside(x, y)) {
        return false;
    }

    return isFree(x, y) &&
           !isEnemyNearby(x, y) &&
           state.world[x][y].turnsToExplosion != 1;
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

    // If there are pickups, select one of them
    if (pickupIds.length > 0) {
        // Select the nearest reachable pickup as a target
        var shortest = Infinity;
        for (var i = 0; i < pickupIds.length; ++i) {
            var pickup = state.pickups[pickupIds[i]];

            // Do not select the current pickup again
            if (targetLocation && pickup.coordinates.x === targetLocation.x && pickup.coordinates.y === targetLocation.y) {
                continue;
            }

            // Calculate the distance to the pickup
            var path = shortestPath(state.coordinates, pickup.coordinates);
            if (path.length > 0 && path.length < shortest) {
                shortest = path.length;
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
var Heap = require("heap");
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

            // Skip neighbors that are closed or that are not free
            if (neighbor.closed || !isFree(neighbor.x, neighbor.y)) {
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



///////////////////////////////////////////////////////////////////////////////
// DO NOT MODIFY THE LINES BELOW                                             //
///////////////////////////////////////////////////////////////////////////////

var state; // Current world state

// Receives a message from the server
process.on("message", function(data) {
    state = data;

    if ("world" in data) {
        // This message contains world state information
        var action = handleTurn();
        process.send(action);
    } else {
        // This message informs about player's death
        handleDeath();
    }
});
