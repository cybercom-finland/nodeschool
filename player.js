var Entity = require("./entity.js");

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

function Player(name, socket, connected, world) {
    Entity.call(this, world);
    this.name = name;
    this.socket = socket;
    this.connected = connected;
};

module.exports = Player;
