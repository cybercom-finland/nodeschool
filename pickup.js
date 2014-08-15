var Entity = require("./entity.js");

Pickup.prototype = Object.create(Entity.prototype);
Pickup.prototype.constructor = Pickup;

function Pickup(world) {
    Entity.call(this, world);
    this.connected = true;

    // Choose what kind of pickup this is
    var rnd = Math.random();
    if (rnd < 0.25) {
        this.type = "Power";
    } else if (rnd < 0.5) {
        this.type = "Shuffle";
    } else if (rnd < 0.75) {
        this.type = "Walls";
    } else {
        this.type = "Bomb";
    }
};

Pickup.prototype.toString = function() {
    return this.type;
}

module.exports = Pickup;
