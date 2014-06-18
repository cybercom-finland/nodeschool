var players = {};
var world = {};
var width;
var height;

var game;

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

function onWorldState(state) {
    // TODO: Draw static objects
    console.log(state);
    world = state;
    width = state.length;
    height = state[0].length;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            game.add.sprite(x * 16, y * 16, "bomber_atlas", TEXTURES.OpenSpace);
            if (world[x][y].type === "HardBlock") {
                game.add.sprite(x * 16, y * 16, "bomber_atlas", TEXTURES.HardBlock);
            } else if (world[x][y].type === "SoftBlock") {
                game.add.sprite(x * 16, y * 16, "bomber_atlas", TEXTURES.SoftBlock);
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
    game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", TEXTURES.Player1FaceDown);
}

function onMovePlayer(name, coords) {
    console.log("Player", name, "moved:", players[name].x, players[name].y, "->", coords.x, coords.y);

    game.add.sprite(players[name].x * 16, players[name].y * 16, "bomber_atlas", TEXTURES.OpenSpace);

    if (players[name].x < coords.x) {
        game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", TEXTURES.Player1FaceRight);
    } else if (players[name].x > coords.x) {
        var sprite = game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", TEXTURES.Player1FaceRight);
        // Flip the sprite
        sprite.anchor.setTo(1, 0);
        sprite.scale.x *= -1;
    } else if (players[name].y < coords.y) {
        game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", TEXTURES.Player1FaceDown);
    } else {
        game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", TEXTURES.Player1FaceUp);
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

    game = new Phaser.Game(640, 320, Phaser.AUTO, "", {
        preload: preload
    });

    // Inform the server that we want to receive visualization messages
    socket.emit("startvisualization");

    socket.on("worldstate", onWorldState);
    socket.on("addplayer", onAddPlayer);
    socket.on("moveplayer", onMovePlayer);
};
