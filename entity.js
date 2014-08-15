function Entity(world) {
    this.coordinates = {};
    this.world = world;
}

Entity.prototype.move = function(direction) {
    if (!this.world) {
        return false;
    }

    var newCoordinates = this.getNewCoordinates(direction);
    if (!newCoordinates) {
        console.log("New coordinates could not be fetched.");
        return false;
    }
    var newX = newCoordinates.x;
    var newY = newCoordinates.y;

    // Make sure that the new coordinates are inside the world and that there is no bomb in the tile
    // Note: player/enemy collisions are handled separately in the functions that call move().
    if (!this.world.isInside(newX, newY) || this.world.isBlocked(newX, newY)) {
        console.log("Cannot move to tile [" + newX + "][" + newY + "].");
        return false;
    }

    // Move to the new coordinates
    this.coordinates.x = newX;
    this.coordinates.y = newY;

    return true;
};

Entity.prototype.getNewCoordinates = function(direction) {
    // Get new coordinates
    var newX = this.coordinates.x;
    var newY = this.coordinates.y;
    if (direction === "UP") {
        --newY;
    } else if (direction === "DOWN") {
        ++newY;
    } else if (direction === "LEFT") {
        --newX;
    } else if (direction === "RIGHT") {
        ++newX;
    } else {
        console.log("Unknown direction.");
        return null;
    }
    return { "x": newX, "y": newY };
}

module.exports = Entity;
