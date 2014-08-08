var Entity = require("./entity.js");

Pickup.prototype = Object.create(Entity.prototype);
Pickup.prototype.constructor = Pickup;

function Pickup(world) {
    Entity.call(this, world);
    this.connected = true;

    // Choose what kind of pickup this is
    var rnd = Math.random();
    if (rnd < 0.333) {
        this.type = "Power";
    } else if (rnd < 0.667) {
        this.type = "Shuffle";
    } else {
        this.type = "Walls";
    }
};

Pickup.prototype.toString = function() {
    return "Pickup";
}

module.exports = Pickup;
