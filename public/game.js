var players = {};
var world = {};
var width;
var height;

var game;

var SCALE = 2; //
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
}

function addSprite(x, y, idxTexture, flip) {
    var sprite = game.add.sprite(x * 16 * SCALE, y * 16 * SCALE, "bomber_atlas", idxTexture);
    if (flip) {
        sprite.anchor.setTo(1, 0);
    }
    sprite.scale.setTo(SCALE, SCALE);
    if (flip) {
        sprite.scale.x *= -1;
    }
}

function onWorldState(state) {
    // TODO: Draw static objects
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
        var sprite = addSprite(coords.x, coords.y, TEXTURES.Player1FaceRight, flip);
        // Flip the sprite
        //sprite.anchor.setTo(1, 0);
        //sprite.scale.x *= -1;
    } else if (players[name].y < coords.y) {
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceDown);
    } else {
        addSprite(coords.x, coords.y, TEXTURES.Player1FaceUp);
    }

    players[name].x = coords.x;
    players[name].y = coords.y;
}

function preload() {
    game.load.spritesheet("bomber_sheet", "bomb_party_v4.png", 16, 16);
    game.load.atlas("bomber_atlas", "bomb_party_v4.png", "bomber_atlas.json");
}

window.onload = function() {
    var socket = io.connect();

    game = new Phaser.Game(640 * SCALE, 320 * SCALE, Phaser.AUTO, "", {
        preload: preload
    });

    // Inform the server that we want to receive visualization messages
    socket.emit("startvisualization");

    socket.on("worldstate", onWorldState);
    socket.on("addplayer", onAddPlayer);
    socket.on("moveplayer", onMovePlayer);
};
