var players = {};
var world = {};
var width;
var height;

var game;

// Scaling factor for scaling the graphics
var SCALE = 2;
// Game world coordinates to separate the actual game area from the background
var GAME_WORLD = {
    x: 20,
    y: 72,
    width: 39 * 16 * SCALE,
    height: 19 * 16 * SCALE
};
// Indexes of textures in the sprite sheet (atlas)
var TEXTURES = {
    HardBlock: 0,
    SoftBlock: 1,
    OpenSpace: 2,
    Player1FaceDown: 3,
    Player1FaceUp: 4,
    Player1FaceRight: 5,
    Player1FaceLeft: 6,
    Bomb7: 7,
    Bomb6: 8,
    Bomb5: 9,
    Bomb4: 10,
    Bomb3: 11,
    Bomb2: 12,
    Bomb1: 13,
    Bomb0: 14,
    Bomb0Left: 15,
    Bomb0Right: 16,
    Bomb0Up: 17,
    Bomb0Down: 18
};

function addSprite(x, y, idxTexture, flip) {
    var sprite = game.add.sprite(x * 16 * SCALE + GAME_WORLD.x, y * 16 * SCALE + GAME_WORLD.y, "bomber_atlas", idxTexture);
    if (flip) {
        sprite.anchor.setTo(1, 0);
    }
    sprite.scale.setTo(SCALE, SCALE);
    if (flip) {
        sprite.scale.x *= -1;
    }
}

function onWorldState(state) {
    console.log(state);
    world = state;
    width = state.length;
    height = state[0].length;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            addSprite(x, y, TEXTURES.OpenSpace);
            if (world[x][y].type === "HardBlock") {
                addSprite(x, y, TEXTURES.HardBlock);
            } else if (world[x][y].type === "SoftBlock") {
                addSprite(x, y, TEXTURES.SoftBlock);
            }
        }
    }
}

function onAddPlayer(name, coords) {
    console.log("Player", name, "added:", coords.x, coords.y);
    players[name] = {
        x: coords.x,
        y: coords.y
    };
    addSprite(coords.x, coords.y, TEXTURES.Player1FaceDown);
}

function onMovePlayer(name, coords) {
    console.log("Player", name, "moved:", players[name].x, players[name].y, "->", coords.x, coords.y);

    addSprite(players[name].x, players[name].y, TEXTURES.OpenSpace);

    if (players[name].x < coords.x) {
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceRight);
    } else if (players[name].x > coords.x) {
        var flip = true;
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceRight, flip);
    } else if (players[name].y < coords.y) {
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceDown);
    } else {
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceUp);
    }

    players[name].x = coords.x;
    players[name].y = coords.y;
}

function preload() {
    game.load.atlas("bomber_atlas", "bomb_party_v4.png", "bomber_atlas.json");
}

function create() {
    game.stage.setBackgroundColor(0xC0C0C0);
    // Add title text to canvas
    var text = "Hack-a-Node";
    var style = {
        font: "32px Lucida Console",
        fill: "#000000",
        align: "center"
    };
    game.add.text(20, 20, text, style);

    // Add support to full screen mode
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    game.input.onDown.add(goFull, this);
}

function goFull() {
    game.scale.startFullScreen();
}

window.onload = function() {
    var socket = io.connect();

    game = new Phaser.Game(40 + GAME_WORLD.width, 200 + GAME_WORLD.height, Phaser.AUTO, "game", {
        preload: preload,
        create: create
    });

    // Inform the server that we want to receive visualization messages
    socket.emit("startvisualization");

    socket.on("worldstate", onWorldState);
    socket.on("addplayer", onAddPlayer);
    socket.on("moveplayer", onMovePlayer);
};
