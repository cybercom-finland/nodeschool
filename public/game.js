var players = {};
var world = {};
var width;
var height;

var game;

function onWorldState(state) {
    // TODO: Draw static objects
    console.log(state);
    world = state;
    width = state.length;
    height = state[0].length;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            //tile = game.add.sprite(x * 16, y * 16, "bomber_sheet", 196); // Open Space
            tile = game.add.sprite(x * 16, y * 16, "bomber_atlas", 2); // Open Space
            if (world[x][y].type === "HardBlock") {
                //tile = game.add.sprite(160, 288, "bomber_sheet"); // Hard Block
                tile = game.add.sprite(x * 16, y * 16, "bomber_atlas", 0); // Hard Block
            } else if (world[x][y].type === "SoftBlock") {
                //tile = game.add.sprite(144, 208, "bomber_sheet"); // Soft Block
                tile = game.add.sprite(x * 16, y * 16, "bomber_atlas", 1); // Soft Block
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
    game.add.sprite(coords.x * 16, coords.y * 16, "bomber_atlas", 3);
}

function onMovePlayer(name, coords) {
    console.log("Player", name, "moved:", players[name].x, players[name].y, "->", coords.x, coords.y);

    game.add.sprite(players[name].x * 16, players[name].y * 16, "bomber_atlas", 2);

    players[name].x = coords.x;
    players[name].y = coords.y;

    game.add.sprite(players[name].x * 16, players[name].y * 16, "bomber_atlas", 3);
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
