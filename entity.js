function Entity(world) {
    this.coordinates = {};
    this.world = world;
}

Entity.prototype.move = function(direction) {
    if (!this.world) {
        return false;
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
        return false;
    }

    // Get new coordinates
    var newX = this.coordinates.x;
    var newY = this.coordinates.y;

    // Make sure that the new coordinates are inside the world
    if (newX < 0 || newY < 0 || newX >= this.world.state.length || newY >= this.world.state[0].length) {
        this.coordinates.x = oldX;
        this.coordinates.y = oldY;
        return false;
    }

    // TODO: Handle collisions and pickups

    // Update the world grid
    this.world.state[newX][newY] = this.world.state[oldX][oldY];
    this.world.state[oldX][oldY] = " ";

    return true;
};

module.exports = Entity;
