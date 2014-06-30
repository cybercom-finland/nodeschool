var Entity = require("./entity.js");

Pickup.prototype = Object.create(Entity.prototype);
Pickup.prototype.constructor = Pickup;

function Pickup(world) {
    Entity.call(this, world);
    this.connected = true;

    // Choose what kind of pickup this is
    this.type = "Power";
};

Pickup.prototype.toString = function() {
    return "Pickup";
}

module.exports = Pickup;
