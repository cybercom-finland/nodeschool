var players = {};
var enemies = {};
var bombs = {};
var pickups = {};

var width;
var height;

var game;
var tilemap;

// Tile size in pixels
var TILESIZE = 32;

// Game world coordinates to separate the actual game area from the background
var GAME_WORLD = {
    offsetX: 20,
    offsetY: 72,
    width: 39 * TILESIZE,
    height: 19 * TILESIZE
};


// Player colors
var COLORS = [ 0xF08080, 0x90EE90, 0x87CEFA, 0xF0E68C ];
var ENEMY_COLORS = [ 0x609744, 0x526573 ];

var PLAYER_CARD_WIDTH = 150;
var ENEMY_CARD_WIDTH = 100;
var BOMB_CARD_WIDTH = 50;
var CARD_HEIGHT = 100;

function addSprite(x, y, texture) {
    var sprite = game.add.sprite(x * TILESIZE + GAME_WORLD.offsetX, y * TILESIZE + GAME_WORLD.offsetY, "sprites_atlas", texture);
    sprite.smoothed = false;

    return sprite;
}

function onWorldState(state) {
    width = state.length;
    height = state[0].length;

    var layerStatic = tilemap.create("static", width, height, TILESIZE, TILESIZE);
    layerStatic.cameraOffset = new Phaser.Point(GAME_WORLD.offsetX, GAME_WORLD.offsetY);
    layerStatic.smoothed = false;

    var layerWalls = tilemap.createBlankLayer("walls", width, height, TILESIZE, TILESIZE);
    layerWalls.cameraOffset = new Phaser.Point(GAME_WORLD.offsetX, GAME_WORLD.offsetY);
    layerWalls.smoothed = false;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (state[x][y] === "HardBlock") {
                tilemap.putTile(69, x, y, layerStatic); // Hard block
            } else if (state[x][y] === "SoftBlock") {
                tilemap.putTile(70, x, y, layerStatic); // Empty space
                tilemap.putTile(68, x, y, layerWalls); // Soft block
            } else {
                tilemap.putTile(70, x, y, layerStatic); // Empty space
            }
        }
    }
}

function onAddSoftBlock(x, y) {
    tilemap.putTile(68, x, y, "walls"); // Soft block
}

function onAddPlayer(name, number, coords) {
    var num = number % 4 + 1;
    var sprite = addSprite(coords.x, coords.y, "Player" + num + "FaceDown");

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
        cross: cross,
        number: num
    };

    if (sprite.x < 0 || sprite.y < 0) {
        // The player is not alive
        sprite.visible = false;
    }
}

function onMovePlayer(name, coords) {
    var player = players[name];
    var sprite = player.sprite;

    var oldX = sprite.x;
    var oldY = sprite.y;
    var newX = coords.x * TILESIZE + GAME_WORLD.offsetX;
    var newY = coords.y * TILESIZE + GAME_WORLD.offsetY;

    if (oldX < newX) {
        sprite.frameName = "Player" + player.number + "FaceRight";
    } else if (oldX > newX) {
        sprite.frameName = "Player" + player.number + "FaceLeft";
    } else if (oldY < newY) {
        sprite.frameName = "Player" + player.number + "FaceDown";
    } else {
        sprite.frameName = "Player" + player.number + "FaceUp";
    }

    var tween = game.add.tween(sprite);
    tween.to({ x: newX, y: newY }, 300);
    tween.start();
}

function onPlayerDeath(name) {
    players[name].sprite.visible = false;
}

function onPlayerRespawn(name, coords) {
    players[name].sprite.visible = true;
    players[name].sprite.x = coords.x * TILESIZE + GAME_WORLD.offsetX;
    players[name].sprite.y = coords.y * TILESIZE + GAME_WORLD.offsetY;
}

function onPlayerDisconnect(name) {
    players[name].card.visible = false;
}

function onAddEnemy(name, type, coords) {
    var texture = "Enemy1FaceDown";
    if (type === 2) {
        texture = "Enemy2FaceDown";
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
    var newX = coords.x * TILESIZE + GAME_WORLD.offsetX;
    var newY = coords.y * TILESIZE + GAME_WORLD.offsetY;

    if (oldX < newX) {
        sprite.frameName = "Enemy1FaceRight";
        if (type === 2) {
            sprite.frameName = "Enemy2FaceRight";
        }
    } else if (oldX > newX) {
        sprite.frameName = "Enemy1FaceLeft";
        if (type === 2) {
            sprite.frameName = "Enemy2FaceLeft";
        }
    } else if (oldY < newY) {
        sprite.frameName = "Enemy1FaceDown";
        if (type === 2) {
            sprite.frameName = "Enemy2FaceDown";
        }
    } else if (oldY > newY){
        sprite.frameName = "Enemy1FaceUp";
        if (type === 2) {
            sprite.frameName = "Enemy2FaceUp";
        }
    }

    var tween = game.add.tween(sprite);
    tween.to({ x: newX, y: newY }, 300);
    tween.start();
}

function onEnemyDeath(name) {
    enemies[name].sprite.visible = false;
}

function onEnemyRespawn(name, type, coords) {
    enemies[name].sprite.visible = true;
    enemies[name].sprite.x = coords.x * TILESIZE + GAME_WORLD.offsetX;
    enemies[name].sprite.y = coords.y * TILESIZE + GAME_WORLD.offsetY;
}

function onAddbomb(id, coords, timer) {
    var sprite = addSprite(coords.x, coords.y, "Bomb1");
    sprite.animations.add("bomb", ["Bomb1", "Bomb2"], 10, true);
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
        var sprite = addSprite(c.x, c.y, "ExplosionMiddle1");
        sprite.animations.add("explosion", ["ExplosionMiddle1", "ExplosionMiddle2", "ExplosionMiddle3"]);
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
    var sprite = addSprite(coords.x, coords.y, "Pickup");

    pickups[id] = {
        sprite: sprite,
    };
}

function onDestroyPickup(id) {
    pickups[id].sprite.destroy();
    delete pickups[id];
}

function preload() {
    game.load.atlas("sprites_atlas", "sprites.png", "sprites_atlas.json");
}

function create() {
    tilemap = game.add.tilemap();
    tilemap.addTilesetImage("tiles", "sprites_atlas", TILESIZE, TILESIZE);

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
    socket.on("addSoftBlock", onAddSoftBlock);
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
