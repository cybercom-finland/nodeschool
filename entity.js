var Item = require("./item.js");

function Entity(world) {
    this.coordinates = {};
    this.world = world;
}

Entity.prototype.move = function(direction) {
    if (!this.world) {
        return null;
    }

    // Remember old coordinates
    var oldX = this.coordinates.x;
    var oldY = this.coordinates.y;

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

    // Make sure that the new coordinates are inside the world and that the tile is free
    if (!this.world.isInside(newX, newY) || !this.world.isFree(newX, newY)) {
        return null;
    }

    // Move to the new coordinates
    this.coordinates.x = newX;
    this.coordinates.y = newY;

    return this.world.grid[newX][newY].type;
};

module.exports = Entity;
