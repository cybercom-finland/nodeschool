var Entity = require("./entity.js");

Bomb.prototype = Object.create(Entity.prototype);
Bomb.prototype.constructor = Bomb;

function Bomb(timer, owner, world) {
    Entity.call(this, world);
    this.timer = timer;
    this.connected = true;
    this.owner = owner;
};

Bomb.prototype.toString = function() {
    return "Bomb (" + this.timer + ")";
}

module.exports = Bomb;
