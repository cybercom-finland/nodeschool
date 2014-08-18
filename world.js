var Player = require("./player.js");
var Enemy = require("./enemy.js");
var Bomb = require("./bomb.js");
var Pickup = require("./pickup.js");

var clc = require("cli-color");

// World size as tiles (not pixels)
var HEIGHT = 19;
var WIDTH = 39;

var bombCounter = 0;
var pickupCounter = 0;

// Constructor for World object
function World() {
    this.width = WIDTH;
    this.height = HEIGHT;
    console.log("Creating world with " + this.width + "x" + this.height + " tiles");

    this.playerCount = 0;
    this.players = {};
    this.bombs = {};
    this.pickups = {};
    this.enemyCount = 4;
    this.enemies = {};
    this.nextStartPoint = 5;

    // Create an empty world surrounded by borders
    this.grid = new Array(this.width);
    for (var x = 0; x < this.width; x++) {
        this.grid[x] = new Array(this.height);
        for (var y = 0; y < this.height; y++) {
            if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                this.grid[x][y] = "HardBlock";
            }
        }
    }

    this.addStaticItemsToWorld();
    this.addEnemies();

    this.nextStartPoint = 1;
}

World.prototype.addStaticItemsToWorld = function() {
    // Create "bomberman level 1" like world having hard blocks at (evenX, evenY) coordinates
    for (var x = 1; x < this.width - 1; x++) {
        for (var y = 1; y < this.height - 1; y++) {
            if (x % 2 || y % 2 || x === (this.width - 2) || y === (this.height - 2)) {
                this.grid[x][y] = "OpenSpace";
            } else {
                this.grid[x][y] = "HardBlock";
            }
        }
    }

    // The soft blocks are added to random free spaces with the following rules:
    // - The world is divided into 5 x 5 "grids"
    // - Every other grid to both directions (3 x 3) have more open space having 0.1 probability of Soft Blocks
    //   - These areas can be considered as good starting points (at least in the beginning of the game)
    // - The rest of the world has 0.7 probability of Soft Blocks
    var lowLevel = 0.1;
    var highLevel = 0.7;
    for (var x = 1; x < this.width - 1; x++) {
        for (var y = 1; y < this.height - 1; y++) {
            var random = Math.random();
            var randomLevel = highLevel;
            if ((x < (this.width * 0.2) || x > (this.width * 0.8) || (x > (this.width * 0.4) && x < (this.width * 0.6))) &&
                (y < (this.height * 0.2) || y > (this.height * 0.8) || (y > (this.height * 0.4) && y < (this.height * 0.6)))) {
                randomLevel = lowLevel;
            }
            if (random < randomLevel && this.isEmpty(x, y)) {
                this.grid[x][y] = "SoftBlock";
            }
        }
    }
};

World.prototype.addEnemies = function(number) {
    for (var i = 0; i < this.enemyCount; i++) {
        var enemyName = "Enemy" + (i + 1);
        var enemyType = 1;
        if (i % 2) {
            enemyType = 2;
        }
        this.addEnemy(enemyName, enemyType);
    }
}

World.prototype.addSoftBlock = function(x, y) {
    this.grid[x][y] = "SoftBlock";
};

World.prototype.clearTile = function(x, y) {
    this.grid[x][y] = "OpenSpace";
}

// Gets a peaceful start point for new (reborn) player
// The world is separated into 5x5 grid,
// having 3x3 areas for start point candidates.
// The peaceful start points are searched in the following order:
//
//     1 5 2
//
//     6 9 7
//
//     3 8 4
//
World.prototype.getPeacefulStartPoint = function(name, callCount) {
    callCount = callCount || 0;
    ++callCount;

    // Find a free tile
    var randomX = Math.floor((Math.random() * (this.width - 1)) + 1);
    var randomY = Math.floor((Math.random() * (this.height - 1)) + 1);
    var i = 0;
    do {
        if (i > 10) {
            this.nextStartPoint++;
            if (this.nextStartPoint === 10) {
                this.nextStartPoint = 1;
            }
        }
        ++i;

        if (this.nextStartPoint === 1) {
            // Upper left corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + 1);
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + 1);
        } else if (this.nextStartPoint === 2) {
            // Upper right corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.80));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + 1);
        } else if (this.nextStartPoint === 3) {
            // Lower left corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + 1);
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.80));
        } else if (this.nextStartPoint === 4) {
            // Lower right corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.80));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.80));
        } else if (this.nextStartPoint === 5) {
            // Upper right corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.40));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + 1);
        } else if (this.nextStartPoint === 6) {
            // Lower left corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + 1);
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.40));
        } else if (this.nextStartPoint === 7) {
            // Lower right corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.80));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.40));
        } else if (this.nextStartPoint === 8) {
            // Lower left corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.40));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.80));
        } else if (this.nextStartPoint === 9) {
            // Lower right corner
            randomX = Math.floor((Math.random() * (this.width * 0.20)) + Math.floor(this.width * 0.40));
            randomY = Math.floor((Math.random() * (this.height * 0.20)) + Math.floor(this.height * 0.40));
        }
    } while (!this.isEmpty(randomX, randomY));

    if (callCount < 10) {
        if (!this.isEnoughSpace(randomX, randomY) || !this.isPeaceful(randomX, randomY, name)) {
            return this.getPeacefulStartPoint(name, callCount);
        }
    }

    this.nextStartPoint++;
    if (this.nextStartPoint === 10) {
        this.nextStartPoint = 1;
    }
    return [randomX, randomY];
}

// Gets start point for a new player
World.prototype.getStartPointForNewPlayer = function(name) {
    var startPoint = this.getPeacefulStartPoint(name);
    var randomX = startPoint[0];
    var randomY = startPoint[1];

    if (this.grid[randomX][randomY] && this.grid[randomX][randomY] === "OpenSpace") {
        return {
            x: randomX,
            y: randomY
        }
    } else {
        // If invalid or reserved point, call this recursively
        return this.getStartPointForNewPlayer(name);
    }
}

// Creates a new player and returns it
World.prototype.addPlayer = function(name, socket) {
    var player = new Player(name, socket, this);
    player.coordinates = this.getStartPointForNewPlayer(name);
    this.players[name] = player;
    this.playerCount++;

    return player;
}

// Creates a new player and returns it
World.prototype.addEnemy = function(name, type) {
    var enemy = new Enemy(name, type, this);
    enemy.coordinates = this.getStartPointForNewPlayer(name);
    this.enemies[name] = enemy;

    return enemy;
}

// Returns a player
World.prototype.getPlayer = function(name) {
    return this.players[name];
}

// Creates a new bomb and returns it
World.prototype.addBomb = function(player) {
    var bomb = new Bomb(player, this);
    bomb.coordinates.x = player.coordinates.x;
    bomb.coordinates.y = player.coordinates.y;
    bomb.id = bombCounter;

    this.bombs[bombCounter] = bomb;
    ++bombCounter;

    return bomb;
}

// Creates a new pickup and returns it
World.prototype.addPickup = function(x, y) {
    var pickup = new Pickup(this);
    pickup.coordinates.x = x;
    pickup.coordinates.y = y;
    pickup.id = pickupCounter;

    this.pickups[pickupCounter] = pickup;
    ++pickupCounter;

    return pickup;
}

// Removes a pickup
World.prototype.removePickup = function(id) {
    if (this.pickups.hasOwnProperty(id)) {
        delete this.pickups[id];
        return true;
    } else {
        return false;
    }
}

// Returns coordinates of all enemies controlled by a computer
World.prototype.getEnemies = function() {
    var self = this;
    var enemies = {};

    Object.keys(this.enemies).forEach(function(enemyName) {
        enemies[enemyName] = {
            "coordinates": self.enemies[enemyName].coordinates
        };
    });

    return enemies;
}

// Returns coordinates of all other players
World.prototype.getAllPlayers = function() {
    var self = this;
    var players = {};

    Object.keys(this.players).forEach(function(playerName) {
        players[playerName] = {
            "coordinates": self.players[playerName].coordinates
        };
    });

    return players;
}

// Returns coordinates of all other players
World.prototype.getOtherPlayers = function(name) {
    var self = this;
    var players = {};

    Object.keys(this.players).forEach(function(playerName) {
        if (playerName !== name) {
            players[playerName] = {
                "coordinates": self.players[playerName].coordinates,
                "score": self.players[playerName].score
            };
        }
    });

    return players;
}

// Returns coordinates and other information of all bombs
World.prototype.getBombs = function() {
    var self = this;
    var bombs = {};

    Object.keys(this.bombs).forEach(function(bombId) {
        bombs[bombId] = {
            "coordinates": self.bombs[bombId].coordinates,
            "timer": self.bombs[bombId].timer,
            "size": self.bombs[bombId].size
        };
    });

    return bombs;
}

// Returns coordinates and type of all pickups
World.prototype.getPickups = function() {
    var self = this;
    var pickups = {};

    Object.keys(this.pickups).forEach(function(pickupId) {
        pickups[pickupId] = {
            "coordinates": self.pickups[pickupId].coordinates,
            "type": self.pickups[pickupId].type,
        };
    });

    return pickups;
}

// Returns a world grid that will be sent to a client
World.prototype.getWorldGrid = function() {
    var self = this;

    var world = new Array(this.width);
    for (var i = 0; i < this.width; ++i) {
        world[i] = new Array(this.height);
        for (var j = 0; j < this.height; ++j) {
            // Information about hard and soft blocks
            world[i][j] = {
                hardBlock: this.grid[i][j] === "HardBlock",
                softBlock: this.grid[i][j] === "SoftBlock"
            };

            // Information about players, enemies, pickups and bombs
            var player = this.getPlayerByCoordinates(i, j);
            var enemy = this.getEnemyByCoordinates(i, j);
            var pickup = this.getPickupByCoordinates(i, j);
            var bomb = this.getBombByCoordinates(i, j);
            world[i][j].playerName = player ? player.name : null;
            world[i][j].enemyName = enemy ? enemy.name : null;
            world[i][j].pickupId = pickup ? pickup.id : null;
            world[i][j].bombId = bomb ? bomb.id : null;
            world[i][j].free = this.isEmpty(i, j) || this.getPickupByCoordinates(i, j) !== null;
            world[i][j].turnsToExplosion = 0;
        }
    }

    // For convenience, we also store information about explosions that are known to happen soon
    var bombIds = Object.keys(this.bombs);
    for (i = 0; i < bombIds.length; ++i) {
        var bomb = this.bombs[bombIds[i]];
        explode(bomb, bomb.timer);
    }
    function explode(bomb, turnsToExplosion) {
        var explodingTiles = bomb.getExplodingCoordinates();
        for (var i = 0; i < explodingTiles.length; ++i) {
            var c = explodingTiles[i];
            if (!world[c.x][c.y].turnsToExplosion || turnsToExplosion < world[c.x][c.y].turnsToExplosion) {
                world[c.x][c.y].turnsToExplosion = turnsToExplosion;

                // Chain the bomb explosions
                var explodingBomb = self.getBombByCoordinates(c.x, c.y);
                if (explodingBomb) {
                    explode(explodingBomb, turnsToExplosion);
                }
            }
        }
    }

    return world;
}


// Checks if the coordinates are inside the world
World.prototype.isInside = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

// Checks if the tile is free
World.prototype.isEmpty = function(x, y) {
    if (!this.grid[x] || !this.grid[x][y]) {
        console.log("Invalid call for isEmpty(" + x + ", " + y + ")");
        return false;
    }
    var tile = this.grid[x][y];

    var free = true;
    if (tile === "HardBlock" || tile === "SoftBlock" ||
        this.getPlayerByCoordinates(x, y) !== null || this.getEnemyByCoordinates(x, y) !== null ||
        this.getBombByCoordinates(x, y) !== null || this.getPickupByCoordinates(x, y) !== null) {
        // Tile is not free
        free = false;
    }

    return free;
};

// Checks if the tile type is block
World.prototype.isBlocked = function(x, y) {
    if (!this.grid[x] || !this.grid[x][y]) {
        console.log("Invalid call for isBlocked(" + x + ", " + y + ")");
        return true;
    }
    var tile = this.grid[x][y];

    var blocked = false;
    if (tile === "HardBlock" || tile === "SoftBlock" ||
        this.getBombByCoordinates(x, y) !== null) {
        // Tile is blocked
        blocked = true;
    }

    return blocked;
};

// Checks if there is enough space for startup
World.prototype.isEnoughSpace = function(x, y, direction) {
    var freeAtNorth = this.grid[x][y - 1] === "OpenSpace" ? true : false;
    var freeAtEast = this.grid[x + 1][y] === "OpenSpace" ? true : false;
    var freeAtSouth = this.grid[x][y + 1] === "OpenSpace" ? true : false;
    var freeAtWest = this.grid[x - 1][y] === "OpenSpace" ? true : false;

    /// Find an 'L' corner. That's enough open space to explode a bomb safely.
    if ((freeAtNorth && freeAtEast) || (freeAtEast && freeAtSouth) ||
        (freeAtSouth && freeAtWest) || (freeAtWest && freeAtNorth)) {
        return true;
    } else {
        // If 'L' is not found, search recursively from the nearest open space tiles
        // Note: Don't traverse back to the direction from where we got here
        if (freeAtNorth && direction !== "south") {
            freeAtNorth = this.isEnoughSpace(x, y - 1, "north");
        }
        if (freeAtEast && direction !== "west") {
            freeAtEast = this.isEnoughSpace(x + 1, y, "east");
        }
        if (freeAtSouth && direction !== "north") {
            freeAtSouth = this.isEnoughSpace(x, y + 1, "south");
        }
        if (freeAtWest && direction !== "east") {
            freeAtWest = this.isEnoughSpace(x - 1, y, "west");
        }
        if (freeAtNorth || freeAtEast || freeAtSouth || freeAtWest) {
            return true;
        } else {
            return false;
        }
    }
};

// Checks if the tile is "peaceful" (e.g. for startup)
World.prototype.isPeaceful = function(x, y, name) {
    var otherPlayers = this.getOtherPlayers(name);
    var enemies = this.getEnemies();
    var bombs = this.getBombs();

    for (var i = 0; i < otherPlayers.length; i++) {
        var xDiff = Math.abs(x - otherPlayers[i].coordinates.x);
        var yDiff = Math.abs(y - otherPlayers[i].coordinates.y);
        if (xDiff < 3 && yDiff < 3) {
            console.log("Another player is too close");
            return false;
        }
    }
    for (var i = 0; i < enemies.length; i++) {
        var xDiff = Math.abs(x - enemies[i].coordinates.x);
        var yDiff = Math.abs(y - enemies[i].coordinates.y);
        if (xDiff < 3 && yDiff < 3) {
            console.log("An enemy is too close");
            return false;
        }
    }
    for (i = 0; i < bombs.length; i++) {
        var xDiff = Math.abs(x - bombs[i].coordinates.x);
        var yDiff = Math.abs(y - bombs[i].coordinates.y);
        if (xDiff < 3 && yDiff < 3) {
            console.log("A bomb is too close");
            return false;
        }
    }

    return true;
};

World.prototype.getBombByCoordinates = function(x, y) {
    if (!this.bombs) {
        return null;
    }

    var bombIds = Object.keys(this.bombs);

    for (var i = 0; i < bombIds.length; ++i) {
        var bomb = this.bombs[bombIds[i]];
        if (bomb.coordinates.x === x && bomb.coordinates.y === y) {
            return bomb;
        }
    }

    return null;
}

World.prototype.getPlayerByCoordinates = function(x, y) {
    if (!this.players) {
        return null;
    }

    var playerIds = Object.keys(this.players);

    for (var i = 0; i < playerIds.length; ++i) {
        var player = this.players[playerIds[i]];
        if (player.coordinates.x === x && player.coordinates.y === y) {
            return player;
        }
    }

    return null;
}

World.prototype.getEnemyByCoordinates = function(x, y) {
    if (!this.enemies) {
        return null;
    }

    var enemyIds = Object.keys(this.enemies);

    for (var i = 0; i < enemyIds.length; ++i) {
        var enemy = this.enemies[enemyIds[i]];
        if (enemy.coordinates.x === x && enemy.coordinates.y === y) {
            return enemy;
        }
    }

    return null;
}

World.prototype.getPickupByCoordinates = function(x, y) {
    if (!this.pickups) {
        return null;
    }

    var pickupIds = Object.keys(this.pickups);

    for (var i = 0; i < pickupIds.length; ++i) {
        var pickup = this.pickups[pickupIds[i]];
        if (pickup.coordinates.x === x && pickup.coordinates.y === y) {
            return pickup;
        }
    }

    return null;
}

World.prototype.explodeBomb = function(bomb) {
    var self = this;
    var explodingTiles = bomb.getExplodingCoordinates();

    var explodingWalls = [];
    var explodingPlayerNames = [];
    var explodingEnemyNames = [];
    var explodingBombIds = [];
    var explodingPickupIds = [];

    explodingTiles.forEach(function(c) {
        if (self.grid[c.x][c.y] === "SoftBlock") {
            explodingWalls.push(c);
        }

        var player = self.getPlayerByCoordinates(c.x, c.y);
        if (player !== null) {
            explodingPlayerNames.push(player.name);
        }

        var enemy = self.getEnemyByCoordinates(c.x, c.y);
        if (enemy !== null) {
            explodingEnemyNames.push(enemy.name);
        }

        var explodingBomb = self.getBombByCoordinates(c.x, c.y);
        if (explodingBomb !== null && bomb !== explodingBomb) {
            explodingBombIds.push(explodingBomb.id);
        }

        var pickup = self.getPickupByCoordinates(c.x, c.y);
        if (pickup !== null) {
            explodingPickupIds.push(pickup.id);
        }
    });

    delete this.bombs[bomb.id];

    return {
        bombId: bomb.id,
        explodingTiles: explodingTiles,
        explodingWalls: explodingWalls,
        explodingPlayerNames: explodingPlayerNames,
        explodingEnemyNames: explodingEnemyNames,
        explodingBombIds: explodingBombIds,
        explodingPickupIds: explodingPickupIds
    };
}

World.prototype.getSoftBlockCount = function() {
    var count = 0;
    for (var i = 0; i < this.width; ++i) {
        for (var j = 0; j < this.height; ++j) {
            if (this.grid[i][j] === "SoftBlock") {
                ++count;
            }
        }
    }
    return count;
};

World.prototype.isSoftBlock = function(x, y) {
    return this.isInside(x, y) && this.grid[x][y] === "SoftBlock";
}

World.prototype.isHardBlock = function(x, y) {
    return this.isInside(x, y) && this.grid[x][y] === "HardBlock";
}

World.prototype.isOpenSpace = function(x, y) {
    return this.isInside(x, y) && this.grid[x][y] === "OpenSpace";
}

module.exports = World;
