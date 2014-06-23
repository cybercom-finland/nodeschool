var Item = require("./item.js");
var Player = require("./player.js");
var Bomb = require("./bomb.js");

var clc = require("cli-color");

// World size as tiles (not pixels)
var HEIGHT = 19;
var WIDTH = 39;

var bombCounter = 0;

// Constructor for World object
//
// Initial list of basic characters that can be used demonstrating the world,
// before graphics library is taken into use:
//
//  - '#': Block
//  - ' ': Open space
//  - 'X': Wall
//  - 'Q': Bomb
//  - '?': Pickup
//  - '!': Enemy
//  - <n>: Player <n>
//
//  TODO: This is only an initial world state for easy textual visualization.
//  To be designed and developped further to support real functionality,
//  e.g. bombs need timers, players need names and pickup items need details

function World() {
    this.width = WIDTH;
    this.height = HEIGHT;
    console.log("Creating world with " + this.width + "x" + this.height + " tiles");

    // Create an empty world surrounded by borders
    this.grid = new Array(this.width);
    for (var x = 0; x < this.width; x++) {
        this.grid[x] = new Array(this.height);
        for (var y = 0; y < this.height; y++) {
            if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                this.grid[x][y] = new Item.HardBlockItem();
            }
        }
    }

    this.addStaticItemsToWorld();

    this.players = {};
    this.bombs = {};
}

World.prototype.addStaticItemsToWorld = function() {

    // Create "bomberman level 1" like world having hard blocks at (evenX, evenY) coordinates
    for (var x = 1; x < this.width - 1; x++) {
        for (var y = 1; y < this.height - 1; y++) {
            if (x % 2 || y % 2 || x === (this.width - 2) || y === (this.height - 2)) {
                this.grid[x][y] = new Item.OpenSpaceItem();
            } else {
                this.grid[x][y] = new Item.HardBlockItem();
            }
        }
    }

    // Add soft blocks to random free tiles
    this.addSoftBlocks();

    //console.log(JSON.stringify(this.grid))
    console.log("World:");
    for (var y = 0; y < this.grid[0].length; y++) {
        var line = "    ";
        for (var x = 0; x < this.grid.length; x++) {
            var c = this.grid[x][y].value;
            if (c === "#") {
                line += c;
            } else if (c === "X") {
                line += clc.blackBright(c);
            } else {
                line += " ";
            }
        }
        console.log(line);
    }

}

// Adds hard blocks to the empty world
World.prototype.addHardBlocks = function() {
    for (var x = 1; x < this.width - 1; x++) {
        for (var y = 1; y < this.height - 1; y++) {
            var random = Math.random();
            if (random < 0.2) {
                this.grid[x][y] = new Item.HardBlockItem();
                //console.log("Hard Block at [" + x + "][" + y + "]");
            }
        }
    }
};

// Adds soft blocks to the grid having hard blocks inserted
World.prototype.addSoftBlocks = function() {
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
            if (random < randomLevel && this.isFree(x, y)) {
                this.grid[x][y] = new Item.SoftBlockItem();
                //console.log("Soft Block at [" + x + "][" + y + "]");
            }
        }
    }
};

World.prototype.getRandomItem = function() {
    var random = Math.random();
    if (random < 0.2) {
        return new Item.HardBlockItem();
    } else if (random < 0.5) {
        return new Item.SoftBlockItem();
    } else {
        return new Item.OpenSpaceItem();
    }
}

// Gets start point for a new player
//
// Note: Coordinates are currently got randomly,
// probably some (more) AI is needed, to get a "peaceful" startup
// (not next to another player or exploding bomb etc)

World.prototype.getStartPointForNewPlayer = function() {
    // Get random coordinates between the borders (1..length-1)
    var randomX = Math.floor(Math.random() * (this.width - 1) + 1);
    var randomY = Math.floor(Math.random() * (this.height - 1) + 1);
    console.log("Random point: [" + randomX + "][" + randomY + "]");
    console.log("State: " + this.grid[randomX][randomY].value);
    if (this.grid[randomX][randomY] && this.grid[randomX][randomY].value === ' ') {
        return {
            x: randomX,
            y: randomY
        }
    } else {
        // If invalid or reserved point, call this recursively
        return this.getStartPointForNewPlayer();
    }
}

// Creates a new player and returns it
World.prototype.addPlayer = function(name, socket) {
    var player = new Player(name, socket, this);
    player.coordinates = this.getStartPointForNewPlayer();
    this.players[name] = player;

    return player;
}

// Returns a player
World.prototype.getPlayer = function(name) {
    return this.players[name];
}

World.prototype.addBomb = function(player) {
    var bomb = new Bomb(5, 2, player, this);
    bomb.coordinates.x = player.coordinates.x;
    bomb.coordinates.y = player.coordinates.y;
    bomb.id = bombCounter;

    this.bombs[bombCounter] = bomb;
    ++bombCounter;

    return bomb;
}

// Returns coordinates of all enemy players
World.prototype.getEnemies = function(name) {
    var self = this;
    var enemies = [];

    Object.keys(this.players).forEach(function(enemyName) {
        if (enemyName !== name) {
            enemies.push({
                "coordinates": self.players[enemyName].coordinates
            });
        }
    });

    return enemies;
}

// Returns coordinates and a timer of all bombs
World.prototype.getBombs = function() {
    var self = this;
    var bombs = [];

    Object.keys(this.bombs).forEach(function(bombId) {
        bombs.push({
            "coordinates": self.bombs[bombId].coordinates,
            "timer": self.bombs[bombId].timer
        });
    });

    return bombs;
}

// Checks if the coordinates are inside the world
World.prototype.isInside = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

// Checks if the tile is free
World.prototype.isFree = function(x, y) {
    var tileType = this.grid[x][y].type;
    var free = true;

    if (tileType === "HardBlock" || tileType === "SoftBlock" ||
        this.getPlayerByCoordinates(x, y) !== null || this.getBombByCoordinates(x, y) !== null) {
        // Tile is not free
        free = false;
    }

    return free;
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

World.prototype.explodeBomb = function(bomb) {
    var self = this;
    var explodingTiles = bomb.getExplodingCoordinates();

    var explodingWalls = [];
    var explodingPlayers = [];
    var explodingBombs = [];

    explodingTiles.forEach(function(c) {
        if (self.grid[c.x][c.y].type === "SoftBlock") {
            self.grid[c.x][c.y] = new Item.OpenSpaceItem();
            explodingWalls.push(c);
        }

        var player = self.getPlayerByCoordinates(c.x, c.y);
        if (player !== null) {
            explodingPlayers.push(player);
        }

        var bomb = self.getBombByCoordinates(c.x, c.y);
        if (bomb !== null) {
            explodingBombs.push(bomb);
        }
    });

    delete this.bombs[bomb.id];

    return {
        explodingTiles: explodingTiles,
        explodingWalls: explodingWalls,
        explodingPlayers: explodingPlayers,
        explodingBombs: explodingBombs
    };
}

module.exports = World;
