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
        return this.handleTurnEnemy2();
    }
}

// Enemy 1 just moves straight until it collides.
// After collision, it starts moving to random direction.
Enemy.prototype.handleTurnEnemy1 = function() {
    var x = this.coordinates.x;
    var y = this.coordinates.y;
    var direction = this.getBasicDirection(x, y);
    if (direction) {
        this.movingDirection = direction;
    }
    return this.move(this.movingDirection);
}

// Enemy 2 moves like enemy 1,
// except for it looks at every step if a player is visible.
// If one player is visible, it starts following the player.
// If multiple players are visible, it starts following the closest player.
Enemy.prototype.handleTurnEnemy2 = function() {
    var x = this.coordinates.x;
    var y = this.coordinates.y;

    var direction = this.getBasicDirection(x, y);
    if (direction) {
        this.movingDirection = direction;
    }
    var oldDirection = this.movingDirection;

    var closestDistance = null;
    var playerUp = this.searchForPlayer(x, y, "UP");
    var playerRight = this.searchForPlayer(x, y, "RIGHT");
    var playerDown = this.searchForPlayer(x, y, "DOWN");
    var playerLeft = this.searchForPlayer(x, y, "LEFT");
    if (playerUp || playerRight || playerDown || playerLeft) {
        console.log(this.name + " at [" + x + "][" + y + "] found a player");
    }

    var foundPlayers = 0;
    if (playerUp !== null) {
        foundPlayers++;
        var distance = Math.abs(y - playerUp[1]);
        console.log("Distance UP   : " + distance);
        if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            this.movingDirection = "UP";
        }
    }
    if (playerRight !== null) {
        foundPlayers++;
        var distance = Math.abs(x - playerRight[0]);
        console.log("Distance RIGHT: " + distance);
        if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            this.movingDirection = "RIGHT";
        }
    }
    if (playerDown !== null) {
        foundPlayers++;
        var distance = Math.abs(y - playerDown[1]);
        console.log("Distance DOWN : " + distance);
        if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            this.movingDirection = "DOWN";
        }
    }
    if (playerLeft !== null) {
        foundPlayers++;
        var distance = Math.abs(x - playerLeft[0]);
        console.log("Distance LEFT : " + distance);
        if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            this.movingDirection = "LEFT";
        }
    }

    if (oldDirection !== this.movingDirection) {
        console.log(oldDirection + " => " + this.movingDirection);
    }
    return this.move(this.movingDirection);
}

Enemy.prototype.getBasicDirection = function(x, y) {
    // Continue to the same direction as before, unless:
    // In case of collision, get new random moving direction
    var direction = this.movingDirection;
    if ((direction === "UP" && !this.world.isFree(x, y - 1)) ||
        (direction === "RIGHT" && !this.world.isFree(x + 1, y)) ||
        (direction === "DOWN" && !this.world.isFree(x, y + 1)) ||
        (direction === "LEFT" && !this.world.isFree(x - 1, y))) {
        direction = this.randomDirection(x, y);
    }
    return direction;
}

Enemy.prototype.searchForPlayer = function(x, y, direction) {
    var newX = x;
    var newY = y;
    if (direction === "UP") {
        newY--;
    } else if (direction === "RIGHT") {
        newX++;
    } else if (direction === "DOWN") {
        newY++;
    } else {
        newX--;
    }
    if (this.world.getPlayerByCoordinates(newX, newY)) {
        console.log("PLAYER FOUND AT: [" + newX + "][" + newY + "]");
        return [newX, newY];
    } else if (this.world.isFree(newX, newY)) {
        return this.searchForPlayer(newX, newY, direction);
    } else {
        return null;
    }
}

Enemy.prototype.randomDirection = function(x, y, randomCounter) {
    if (randomCounter === undefined) {
        randomCounter = 0;
    } else if (randomCounter > 10) {
        // Stop eternal recursion, if a free direction is not found
        return null;
    }
    var random = Math.floor(Math.random() * 4);
    if (random === 0 && (x === undefined || y === undefined || this.world.isFree(x, y - 1))) {
        return "UP";
    } else if (random === 1 && (x === undefined || y === undefined || this.world.isFree(x + 1, y))) {
        return "RIGHT";
    } else if (random === 2 && (x === undefined || y === undefined || this.world.isFree(x, y + 1))) {
        return "DOWN";
    } else if (random === 3 && (x === undefined || y === undefined || this.world.isFree(x - 1, y))) {
        return "LEFT";
    } else {
        return this.randomDirection(x, y, ++randomCounter);
    }
}

module.exports = Enemy;
