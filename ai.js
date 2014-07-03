var state;
var targetLocation;

// Receives a world state from the server
process.on("message", function(newState) {
    var action = "";
    state = newState;

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
        if (state.world[x + sx][y].free && state.world[x + sx][y].turnsToExplosion != 1) {
            action = getDirection(sx, 0);
        } else if (state.world[x][y + sy].free && state.world[x][y + sy].turnsToExplosion != 1) {
            action = getDirection(0, sy);
        } else if (state.world[x - sx][y].free && state.world[x - sx][y].turnsToExplosion != 1) {
            action = getDirection(-sx, 0);
        } else if (state.world[x][y - sy].free && state.world[x][y - sy].turnsToExplosion != 1) {
            action = getDirection(0, -sy);
        } else {
            // The player is going to die. Try to leave a bomb
            action = "BOMB";
        }
    } else {
        // Current tile is safe. Try to move towards the target tile
        if (state.world[x + sx][y].free && state.world[x + sx][y].turnsToExplosion != 1) {
            action = getDirection(sx, 0);
        } else if (state.world[x][y + sy].free && state.world[x][y + sy].turnsToExplosion != 1) {
            action = getDirection(0, sy);
        } else {
            // The straight path is blocked
            if (state.bombsAvailable > 0 && state.world[x][y].turnsToExplosion < 0) {
                // Leave a bomb and select a new target
                action = "BOMB";
                targetLocation = getTargetLocation();
            } else {
                // Try to move away and select a new target
                if (state.world[x - sx][y].free && state.world[x - sx][y].turnsToExplosion != 1) {
                    action = getDirection(-sx, 0);
                } else if (state.world[x][y - sy].free && state.world[x][y - sy].turnsToExplosion != 1) {
                    action = getDirection(0, -sy);
                }
                targetLocation = getTargetLocation();
            }
        }
    }

    process.send(action);
});


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
