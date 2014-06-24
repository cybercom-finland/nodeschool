var players = {};
var bombs = {};

var width;
var height;

var game;
var tilemap;

// Scaling factor for scaling the graphics
var SCALE = 2;
// Game world coordinates to separate the actual game area from the background
var GAME_WORLD = {
    offsetX: 20,
    offsetY: 72,
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
    var sprite = game.add.sprite(x * 16 * SCALE + GAME_WORLD.offsetX, y * 16 * SCALE + GAME_WORLD.offsetY, "bomber_atlas", idxTexture);
    sprite.scale.setTo(SCALE, SCALE);
    sprite.smoothed = false;

    return sprite;
}

function onWorldState(state) {
    console.log(state);

    width = state.length;
    height = state[0].length;

    var layerStatic = tilemap.create("static", width, height, 16, 16);
    layerStatic.scale = { x: SCALE, y: SCALE };
    layerStatic.cameraOffset = new Phaser.Point(GAME_WORLD.offsetX, GAME_WORLD.offsetY);
    layerStatic.smoothed = false;

    var layerWalls = tilemap.createBlankLayer("walls", width, height, 16, 16);
    layerWalls.scale = { x: SCALE, y: SCALE };
    layerWalls.cameraOffset = new Phaser.Point(GAME_WORLD.offsetX, GAME_WORLD.offsetY);
    layerWalls.smoothed = false;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (state[x][y].type === "HardBlock") {
                tilemap.putTile(280, x, y, layerStatic); // Hard block
            } else if (state[x][y].type === "SoftBlock") {
                tilemap.putTile(196, x, y, layerStatic); // Empty space
                tilemap.putTile(204, x, y, layerWalls); // Soft block
            } else {
                tilemap.putTile(196, x, y, layerStatic); // Empty space
            }
        }
    }
}

function onAddPlayer(name, coords) {
    var sprite = addSprite(coords.x, coords.y, TEXTURES.Player1FaceDown);

    players[name] = sprite;

    if (sprite.x < 0 || sprite.y < 0) {
        // The player is not alive
        sprite.visible = false;
    }
}

function onMovePlayer(name, coords) {
    var sprite = players[name];

    var oldX = sprite.x;
    var oldY = sprite.y;
    sprite.x = coords.x * 16 * SCALE + GAME_WORLD.offsetX;
    sprite.y = coords.y * 16 * SCALE + GAME_WORLD.offsetY;

    var flip = false;

    if (oldX < sprite.x) {
        sprite.frame = TEXTURES.Player1FaceRight;
    } else if (oldX > sprite.x) {
        sprite.frame = TEXTURES.Player1FaceLeft;
        flip = true;
    } else if (oldY < sprite.y) {
        sprite.frame = TEXTURES.Player1FaceDown;
    } else {
        sprite.frame = TEXTURES.Player1FaceUp;
    }

    if (flip) {
        sprite.anchor.setTo(1, 0);
        sprite.scale.x = -SCALE;
    } else {
        sprite.anchor.setTo(0, 0);
        sprite.scale.x = SCALE;
    }
}

function onPlayerDeath(name) {
    players[name].visible = false;
}

function onPlayerRespawn(name, coords) {
    players[name].visible = true;
    players[name].x = coords.x * 16 * SCALE + GAME_WORLD.offsetX;
    players[name].y = coords.y * 16 * SCALE + GAME_WORLD.offsetY;
}

function onAddbomb(id, coords, timer) {
    var sprite = addSprite(coords.x, coords.y, TEXTURES.Bomb0);
    sprite.animations.add("bomb", [7, 8, 9, 10, 11, 12, 11, 10, 9, 8], 10, true);
    sprite.play("bomb");

    bombs[id] = sprite;
}

function onUpdateBomb(id, coords, timer) {
}

function onBombExplosion(id, data) {
    bombs[id].destroy();

    // Remove destroyed walls
    data.explodingWalls.forEach(function(c) {
        tilemap.removeTile(c.x, c.y, "walls");
    });

    // Add explosion animations
    data.explodingTiles.forEach(function(c) {
        var sprite = addSprite(c.x, c.y, "explosion_1");
        sprite.animations.add("explosion", ["explosion_1", "explosion_2", "explosion_3", "explosion_2", "explosion_1"]);
        sprite.play("explosion", 10, false, true);
    });
}

function preload() {
    game.load.atlas("bomber_atlas", "bomb_party_v4.png", "bomber_atlas.json");
}

function create() {
    tilemap = game.add.tilemap();
    tilemap.addTilesetImage("tiles", "bomber_atlas", 16, 16);

    game.stage.setBackgroundColor(0xC0C0C0);
    game.stage.disableVisibilityChange = true;

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
    //game.input.onDown.add(goFull, this);
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
    socket.on("playerdeath", onPlayerDeath);
    socket.on("playerrespawn", onPlayerRespawn);
    socket.on("addbomb", onAddbomb);
    socket.on("updatebomb", onUpdateBomb);
    socket.on("bombexplosion", onBombExplosion);
};
