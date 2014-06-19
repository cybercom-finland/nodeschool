var Entity = require("./entity.js");

Bomb.prototype = Object.create(Entity.prototype);
Bomb.prototype.constructor = Bomb;

function Bomb(timer, size, owner, world) {
    Entity.call(this, world);
    this.timer = timer;
    this.connected = true;
    this.owner = owner;
    this.size = size;
};

Bomb.prototype.getExplodingCoordinates = function() {
    var coords = [];

    for (var i = -this.size; i <= this.size; ++i) {
        var x = this.coordinates.x + i;
        if (x >= 0 && x < this.world.width) {
            coords.push({ x: x, y: this.coordinates.y });
        }
    }

    for (var j = -this.size; j <= this.size; ++j) {
        var y = this.coordinates.y + j;
        if (j !== 0 && y >= 0 && y < this.world.height) {
            coords.push({ x: this.coordinates.x, y: y });
        }
    }

    return coords;
}

Bomb.prototype.toString = function() {
    return "Bomb (" + this.timer + ")";
}

module.exports = Bomb;
