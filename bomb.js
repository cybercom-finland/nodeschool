var Entity = require("./entity.js");

Bomb.prototype = Object.create(Entity.prototype);
Bomb.prototype.constructor = Bomb;

function Bomb(timer, world) {
    Entity.call(this, world);
    this.timer = timer;
    this.connected = true;
};

Bomb.prototype.toString = function() {
    return "Bomb (" + this.timer + ")";
}

module.exports = Bomb;
