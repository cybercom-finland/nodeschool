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

    // Move coordinates
    if (direction === "UP") {
        --this.coordinates.y;
    } else if (direction === "DOWN") {
        ++this.coordinates.y;
    } else if (direction === "LEFT") {
        --this.coordinates.x;
    } else if (direction === "RIGHT") {
        ++this.coordinates.x;
    } else {
        console.log("Unknown direction.");
        return null;
    }

    // Get new coordinates
    var newX = this.coordinates.x;
    var newY = this.coordinates.y;

    // Make sure that the new coordinates are inside the world
    if (newX < 0 || newY < 0 || newX >= this.world.state.width || newY >= this.world.state.height) {
        this.coordinates.x = oldX;
        this.coordinates.y = oldY;
        return null;
    }


    // Check that the new tile is free
    var tileType = this.world.state[newX][newY].type;
    if (tileType !== "OpenSpace") {
        this.coordinates.x = oldX;
        this.coordinates.y = oldY;
        return null;
    }

    // TODO: Handle pickups

    // Update the world grid
    this.world.state[newX][newY] = this.world.state[oldX][oldY];
    this.world.state[oldX][oldY] = new Item.OpenSpaceItem();

    return tileType;
};

module.exports = Entity;
