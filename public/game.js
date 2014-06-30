var players = {};
var enemies = {};
var bombs = {};
var pickups = {};

var width;
var height;

var game;
var tilemap;

// Tile size in pixels
var TILESIZE = 16;

// Scaling factor for scaling the graphics
var SCALE = 2;
// Game world coordinates to separate the actual game area from the background
var GAME_WORLD = {
    offsetX: 20,
    offsetY: 72,
    width: 39 * TILESIZE * SCALE,
    height: 19 * TILESIZE * SCALE
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
    Bomb0Down: 18,
    Explosion1: 19,
    Explosion2: 20,
    Explosion3: 21,
    Pickup: 22,
    Enemy1FaceDown: 23,
    Enemy1FaceUp: 24,
    Enemy1FaceRight: 25,
    Enemy1FaceLeft: 26,
    Enemy2FaceDown: 27,
    Enemy2FaceUp: 28,
    Enemy2FaceRight: 29,
    Enemy2FaceLeft: 30
};

// Player colors
var COLORS = [ 0xF08080, 0x90EE90, 0x87CEFA, 0xF0E68C ];
var ENEMY_COLORS = [ 0x526573, 0x609744 ];

var PLAYER_CARD_WIDTH = 150;
var ENEMY_CARD_WIDTH = 100;
var BOMB_CARD_WIDTH = 50;
var CARD_HEIGHT = 100;

function addSprite(x, y, idxTexture, flip) {
    var sprite = game.add.sprite(x * TILESIZE * SCALE + GAME_WORLD.offsetX, y * TILESIZE * SCALE + GAME_WORLD.offsetY, "bomber_atlas", idxTexture);
    sprite.scale.setTo(SCALE, SCALE);
    sprite.smoothed = false;

    return sprite;
}

function onWorldState(state) {
    width = state.length;
    height = state[0].length;

    var layerStatic = tilemap.create("static", width, height, TILESIZE, TILESIZE);
    layerStatic.scale = { x: SCALE, y: SCALE };
    layerStatic.cameraOffset = new Phaser.Point(GAME_WORLD.offsetX, GAME_WORLD.offsetY);
    layerStatic.smoothed = false;

    var layerWalls = tilemap.createBlankLayer("walls", width, height, TILESIZE, TILESIZE);
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

    var card;
    card = game.add.group();
    card.visible = false;

    var color;
    if (Object.keys(players).length < COLORS.length) {
        color = COLORS[Object.keys(players).length];
    } else {
        color = 0xEEEEEE;
    }

    var box = game.add.graphics(0, 0);
    box.beginFill(color);
    box.lineStyle(3, 0x000000, 1);
    box.drawRect(0, 0, PLAYER_CARD_WIDTH, CARD_HEIGHT);

    var cross = game.add.graphics(0, 0);
    cross.beginFill(0x000000, 1);
    cross.lineStyle(20, 0x000000, 1);
    cross.moveTo(15, 15);
    cross.lineTo(PLAYER_CARD_WIDTH - 15, CARD_HEIGHT - 15);
    cross.moveTo(PLAYER_CARD_WIDTH - 15, 15);
    cross.lineTo(15, CARD_HEIGHT - 15);

    var nameItem = game.add.text(10, 10, name, { font: "bold 20px Arial", fill: "#000000" });
    var scoreItem = game.add.text(10, 45, "0", { font: "bold 24px Arial", fill: "#000000" });

    card.add(box);
    card.add(nameItem);
    card.add(scoreItem);
    card.add(cross);

    players[name] = {
        sprite: sprite,
        card: card,
        scoreItem: scoreItem,
        cross: cross
    };

    if (sprite.x < 0 || sprite.y < 0) {
        // The player is not alive
        sprite.visible = false;
    }
}

function onMovePlayer(name, coords) {
    var sprite = players[name].sprite;

    var oldX = sprite.x;
    var oldY = sprite.y;
    sprite.x = coords.x * TILESIZE * SCALE + GAME_WORLD.offsetX;
    sprite.y = coords.y * TILESIZE * SCALE + GAME_WORLD.offsetY;

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
    players[name].sprite.visible = false;
}

function onPlayerRespawn(name, coords) {
    players[name].sprite.visible = true;
    players[name].sprite.x = coords.x * TILESIZE * SCALE + GAME_WORLD.offsetX;
    players[name].sprite.y = coords.y * TILESIZE * SCALE + GAME_WORLD.offsetY;
}

function onPlayerDisconnect(name) {
    players[name].card.visible = false;
}

function onAddEnemy(name, type, coords) {
    var texture = TEXTURES.Enemy1FaceDown;
    if (type === 2) {
        texture = TEXTURES.Enemy2FaceDown;
    }
    var sprite = addSprite(coords.x, coords.y, texture);

    var card;
    card = game.add.group();
    card.visible = false;

    var color;
    if (type === 1) {
        color = ENEMY_COLORS[0];
    } else {
        color = ENEMY_COLORS[1];
    }

    var box = game.add.graphics(0, 0);
    box.beginFill(color);
    box.lineStyle(3, 0x000000, 1);
    box.drawRect(0, 0, ENEMY_CARD_WIDTH, CARD_HEIGHT);

    var cross = game.add.graphics(0, 0);
    cross.beginFill(0x000000, 1);
    cross.lineStyle(20, 0x000000, 1);
    cross.moveTo(15, 15);
    cross.lineTo(ENEMY_CARD_WIDTH - 15, CARD_HEIGHT - 15);
    cross.moveTo(ENEMY_CARD_WIDTH - 15, 15);
    cross.lineTo(15, CARD_HEIGHT - 15);

    var nameItem = game.add.text(10, 10, name, { font: "bold 20px Arial", fill: "#000000" });

    card.add(box);
    card.add(nameItem);
    card.add(cross);

    enemies[name] = {
        sprite: sprite,
        card: card,
        cross: cross
    };

    if (sprite.x < 0 || sprite.y < 0) {
        // The enemy is not alive
        sprite.visible = false;
    }
}

function onMoveEnemy(name, type, coords) {
    var sprite = enemies[name].sprite;

    var oldX = sprite.x;
    var oldY = sprite.y;
    sprite.x = coords.x * TILESIZE * SCALE + GAME_WORLD.offsetX;
    sprite.y = coords.y * TILESIZE * SCALE + GAME_WORLD.offsetY;

    var flip = false;

    if (oldX < sprite.x) {
        sprite.frame = TEXTURES.Enemy1FaceRight;
        if (type === 2) {
            sprite.frame = TEXTURES.Enemy2FaceRight;
        }
    } else if (oldX > sprite.x) {
        sprite.frame = TEXTURES.Enemy1FaceLeft;
        if (type === 2) {
            sprite.frame = TEXTURES.Enemy2FaceLeft;
        }
        flip = true;
    } else if (oldY < sprite.y) {
        sprite.frame = TEXTURES.Enemy1FaceDown;
        if (type === 2) {
            sprite.frame = TEXTURES.Enemy2FaceDown;
        }
    } else {
        sprite.frame = TEXTURES.Enemy1FaceUp;
        if (type === 2) {
            sprite.frame = TEXTURES.Enemy2FaceUp;
        }
    }

    if (flip) {
        sprite.anchor.setTo(1, 0);
        sprite.scale.x = -SCALE;
    } else {
        sprite.anchor.setTo(0, 0);
        sprite.scale.x = SCALE;
    }
}

function onEnemyDeath(name) {
    enemies[name].sprite.visible = false;
}

function onEnemyRespawn(name, type, coords) {
    enemies[name].sprite.visible = true;
    enemies[name].sprite.x = coords.x * TILESIZE * SCALE + GAME_WORLD.offsetX;
    enemies[name].sprite.y = coords.y * TILESIZE * SCALE + GAME_WORLD.offsetY;
    console.log(enemies[name])
}

function onAddbomb(id, coords, timer) {
    var sprite = addSprite(coords.x, coords.y, TEXTURES.Bomb0);
    sprite.animations.add("bomb", [7, 8, 9, 10, 11, 12, 11, 10, 9, 8], 10, true);
    sprite.play("bomb");

    var card;
    card = game.add.group();
    card.visible = false;

    var box = game.add.graphics(0, 0);
    box.beginFill(0x666666);
    box.lineStyle(3, 0x000000, 1);
    box.drawRect(0, 0, BOMB_CARD_WIDTH, CARD_HEIGHT);

    var timerItem = game.add.text(18, 35, "0", { font: "bold 24px Arial", fill: "#000000" });

    card.add(box);
    card.add(timerItem);

    bombs[id] = {
        sprite: sprite,
        card: card,
        timerItem: timerItem
    };

    // Bring all players to top
    Object.keys(players).forEach(function(name) {
        players[name].sprite.bringToTop();
    });
}

function onUpdateBomb(id, coords, timer) {
    // Do nothing
}

function onBombExplosion(id, explodingTiles, explodingWalls) {
    bombs[id].sprite.destroy();
    bombs[id].card.destroy();
    delete bombs[id];

    // Remove destroyed walls
    explodingWalls.forEach(function(c) {
        tilemap.removeTile(c.x, c.y, "walls");
    });

    // Add explosion animations
    explodingTiles.forEach(function(c) {
        var sprite = addSprite(c.x, c.y, "explosion_1");
        sprite.animations.add("explosion", ["explosion_1", "explosion_2", "explosion_3", "explosion_2", "explosion_1"]);
        sprite.play("explosion", 10, false, true);
    });
}

function onEntityQueue(queue) {
    var card;
    var x = GAME_WORLD.offsetX;

    queue.forEach(function(entity) {
        if (entity.type === "Player") {
            card = players[entity.name].card;
            players[entity.name].scoreItem.text = entity.score;
            players[entity.name].cross.visible = !entity.active;
            card.x = x;
            x += PLAYER_CARD_WIDTH + 20;
        } else if (entity.type === "Enemy") {
            card = enemies[entity.name].card;
            enemies[entity.name].cross.visible = !entity.active;
            card.x = x;
            x += ENEMY_CARD_WIDTH + 20;
        } else if (entity.type === "Bomb") {
            card = bombs[entity.id].card;
            bombs[entity.id].timerItem.text = entity.timer;
            card.x = x;
            x += BOMB_CARD_WIDTH + 20;
        }

        card.y = GAME_WORLD.offsetY + GAME_WORLD.height + 25;
        card.visible = true;
    });
}

function onAddPickup(id, coords, type) {
    var sprite = addSprite(coords.x, coords.y, "pickup");

    pickups[id] = {
        sprite: sprite,
    };
}

function onDestroyPickup(id) {
    pickups[id].sprite.destroy();
    delete pickups[id];
}

function preload() {
    game.load.atlas("bomber_atlas", "bomb_party_v4.png", "bomber_atlas.json");
}

function create() {
    tilemap = game.add.tilemap();
    tilemap.addTilesetImage("tiles", "bomber_atlas", TILESIZE, TILESIZE);

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
    game.input.onDown.add(goFull, this);
}

function goFull() {
    game.scale.startFullScreen();
}

window.onload = function() {
    var socket = io.connect();

    game = new Phaser.Game(2 * GAME_WORLD.offsetX + GAME_WORLD.width, GAME_WORLD.offsetY + 150 + GAME_WORLD.height, Phaser.AUTO, "game", {
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
    socket.on("playerdisconnect", onPlayerDisconnect);
    socket.on("addenemy", onAddEnemy);
    socket.on("moveenemy", onMoveEnemy);
    socket.on("enemydeath", onEnemyDeath);
    socket.on("enemyrespawn", onEnemyRespawn);
    socket.on("addbomb", onAddbomb);
    socket.on("updatebomb", onUpdateBomb);
    socket.on("bombexplosion", onBombExplosion);
    socket.on("entityqueue", onEntityQueue);
    socket.on("addpickup", onAddPickup);
    socket.on("destroypickup", onDestroyPickup);
};
