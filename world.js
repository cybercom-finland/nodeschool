var Item = require("./item.js");
var Player = require("./player.js");
var Bomb = require("./bomb.js");

// World size as tiles (not pixels)
var HEIGHT = 20;
var WIDTH = 40;

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

    this.grid = new Array(this.width);
    for (var x = 0; x < this.width; x++) {
        this.grid[x] = new Array(this.height);
        for (var y = 0; y < this.height; y++) {
            // Initialize the world with borders
            if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                this.grid[x][y] = new Item.HardBlockItem();
            } else {
                // Other tiles are generated randomly for now
                this.grid[x][y] = this.getRandomItem();
            }
        }
    }

    this.players = {};
    this.bombs = [];
}

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
    var bomb = new Bomb(5, player, this);
    bomb.coordinates.x = player.coordinates.x;
    bomb.coordinates.y = player.coordinates.y;
    this.bombs.push(bomb);

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

// Checks if the coordinates are inside the world
World.prototype.isInside = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

// Checks if the tile is free
World.prototype.isFree = function(x, y) {
    var self = this;
    var tileType = this.grid[x][y].type;
    var free = true;

    if (tileType === "HardBlock" || tileType === "SoftBlock") {
        // Tile is not free
        free = false;
    } else {
        // Check whether the tile is occupied by another player
        Object.keys(this.players).forEach(function(name) {
            var player = self.players[name];
            if (player.coordinates.x === x && player.coordinates.y === y) {
                free = false;
            }
        });
    }

    return free;
};

module.exports = World;
