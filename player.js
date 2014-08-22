var Entity = require("./entity.js");

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

function Player(name, number, socket, world) {
    Entity.call(this, world);
    this.name = name;
    this.number = number;
    this.socket = socket;
    this.connected = true;
    this.bombsDropped = 0;
    this.score = 0;
    this.turnsToRespawn = 0;
    this.resetDefaultValues();
}

Player.prototype.resetDefaultValues = function() {
    this.maxAllowedBombs = 1;
    this.bombTimer = 5;
    this.bombSize = 2;
};

Player.prototype.toString = function() {
    return this.name;
}

module.exports = Player;
