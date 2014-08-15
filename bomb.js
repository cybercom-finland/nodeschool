var Entity = require("./entity.js");

Bomb.prototype = Object.create(Entity.prototype);
Bomb.prototype.constructor = Bomb;

function Bomb(owner, world) {
    Entity.call(this, world);
    this.connected = true;
    this.owner = owner;
    this.timer = owner.bombTimer;
    this.size = owner.bombSize;
};

Bomb.prototype.getExplodingCoordinates = function() {
    var coords = [];
    var i;

    coords.push({ x: this.coordinates.x, y: this.coordinates.y });

    // Left
    for (i = -1; i >= -this.size; --i) {
        var x = this.coordinates.x + i;
        if (x >= 0 && x < this.world.width) {
            if (this.world.isHardBlock(x, this.coordinates.y)) {
                break;
            }
            coords.push({ x: x, y: this.coordinates.y });
            if (this.world.isSoftBlock(x, this.coordinates.y)) {
                break;
            }
        }
    }

    // Right
    for (i = 1; i <= this.size; ++i) {
        var x = this.coordinates.x + i;
        if (x >= 0 && x < this.world.width) {
            if (this.world.isHardBlock(x, this.coordinates.y)) {
                break;
            }
            coords.push({ x: x, y: this.coordinates.y });
            if (this.world.isSoftBlock(x, this.coordinates.y)) {
                break;
            }
        }
    }

    // Up
    for (i = -1; i >= -this.size; --i) {
        var y = this.coordinates.y + i;
        if (y >= 0 && y < this.world.height) {
            if (this.world.isHardBlock(this.coordinates.x, y)) {
                break;
            }
            coords.push({ x: this.coordinates.x, y: y });
            if (this.world.isSoftBlock(this.coordinates.x, y)) {
                break;
            }
        }
    }

    // Down
    for (i = 1; i <= this.size; ++i) {
        var y = this.coordinates.y + i;
        if (y >= 0 && y < this.world.height) {
            if (this.world.isHardBlock(this.coordinates.x, y)) {
                break;
            }
            coords.push({ x: this.coordinates.x, y: y });
            if (this.world.isSoftBlock(this.coordinates.x, y)) {
                break;
            }
        }
    }

    return coords;
}

Bomb.prototype.toString = function() {
    return "Bomb (" + this.timer + ")";
}

module.exports = Bomb;
