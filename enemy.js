var Entity = require("./entity.js");

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

function Enemy(name, type, world) {
    Entity.call(this, world);
    this.connected = true;
    this.name = name;
    this.type = type;
    this.turnsToRespawn = 0;
};

Enemy.prototype.toString = function() {
    return this.name;
}

module.exports = Enemy;
