// Constructor for World object
//
// Initial list of basic characters that can be used demonstrating the world,
// before graphics library is taken into use:
//
//  - '#': Block
//  - ' ': Open space
//  - 'X': Wall
//  - 'O': Bomb
//  - '?': Pickup
//  - '!': Enemy
//  - <n>: Player <n>
//
//  TODO: This is only an initial world state for easy textual visualization.
//  To be designed and developped further to support real functionality,
//  e.g. bombs need timers, players need names and pickup items need details

exports.World = function(width, height) {
    this.width = width;
    this.height = height;
    console.log("Creating world with " + width + "x" + height + " tiles");

    this.state = new Array(width);
    for (var x = 0; x < width; x++) {
        this.state[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            // Initialize the world with borders
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                this.state[x][y] = "#";
            } else {
                // Other tiles are generated randomly for now
                this.state[x][y] = getRandomItem();
            }
        }
    }
}

var getRandomItem = function() {
    var random = Math.random();
    if (random < 0.2) {
        return '#';
    } else if (random < 0.5) {
        return 'X';
    } else {
        return ' ';
    }
}

// Gets start point for a new player
//
// Note: Coordinates are currently got randomly,
// probably some (more) AI is needed, to get a "peaceful" startup
// (not next to another player or exploding bomb etc)

exports.getStartPointForNewPlayer = function(world, name) {
    // Get random coordinates between the borders (1..length-1)
    var randomX = Math.floor(Math.random() * (world.width - 1) + 1);
    var randomY = Math.floor(Math.random() * (world.height - 1) + 1);
    console.log("Random point: [" + randomX + "][" + randomY + "]");
    console.log("State: " + world.state[randomX][randomY]);
    if (world.state[randomX][randomY] && world.state[randomX][randomY] === ' ') {
        world.state[randomX][randomY] = name.charAt(name.length - 1);
        return {
            x: randomX,
            y: randomY
        }
    } else {
        // If invalid or reserved point, call this recursively
        return this.getStartPointForNewPlayer(world, name);
    }
}
