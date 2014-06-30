var Entity = require("./entity.js");

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

function Enemy(name, type, world) {
    Entity.call(this, world);
    this.connected = true;
    this.name = name;
    this.type = type;
    this.turnsToRespawn = 0;

    // Initialize moving direction randomically
    this.movingDirection = this.randomDirection();
};

Enemy.prototype.toString = function() {
    return this.name;
}

Enemy.prototype.handleTurn = function() {
    if (this.type === 1) {
        return this.handleTurnEnemy1();
    } else {
        return this.handleTurnEnemy1();
    }
}

Enemy.prototype.handleTurnEnemy1 = function() {
    var x = this.coordinates.x;
    var y = this.coordinates.y;
    console.log("[" + x + ", " + y + "]")
    // In case of collision, get new random moving direction
    if ((this.movingDirection === "UP" && !(this.world.grid[x][y - 1].type === "OpenSpace")) ||
        (this.movingDirection === "RIGHT" && !(this.world.grid[x + 1][y].type === "OpenSpace")) ||
        (this.movingDirection === "DOWN" && !(this.world.grid[x][y + 1].type === "OpenSpace")) ||
        (this.movingDirection === "LEFT" && !(this.world.grid[x - 1][y].type === "OpenSpace"))) {
        this.movingDirection = this.randomDirection();
    }
    this.move(this.movingDirection);
}

Enemy.prototype.randomDirection = function(x, y) {
    var random = Math.floor(Math.random() * 4);
    if (random === 0 && (x === undefined || y === undefined || this.world.grid[x][y - 1].type === "OpenSpace")) {
        return "UP";
    } else if (random === 1 && (x === undefined || y === undefined || this.world.grid[x + 1][y].type === "OpenSpace")) {
        return "RIGHT";
    } else if (random === 2 && (x === undefined || y === undefined || this.world.grid[x][y + 1].type === "OpenSpace")) {
        return "DOWN";
    } else if (random === 3 && (x === undefined || y === undefined || this.world.grid[x - 1][y].type === "OpenSpace")) {
        return "LEFT";
    } else {
        return this.randomDirection();
    }
}

module.exports = Enemy;
