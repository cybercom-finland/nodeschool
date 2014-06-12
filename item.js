// Generic item
function GenericItem(type, displayValue) {
    this.type = type;
    this.value = displayValue;
    this.mutable = true;
};

// Hard block item
exports.HardBlockItem = function() {
    var hardBlock = new GenericItem("HardBlock", '#');
    this.type = hardBlock.type;
    this.value = hardBlock.value;
    this.mutable = false;
}

// Soft block (wall) item
exports.SoftBlockItem = function(hiddenItem) {
    var softBlock = new GenericItem("SoftBlock", 'X');
    this.type = softBlock.type;
    this.value = softBlock.value;
    this.mutable = softBlock.mutable;
    this.hiddenItem = hiddenItem || {};
}

// Open space item
exports.OpenSpaceItem = function() {
    var openSpace = new GenericItem("OpenSpace", ' ');
    this.type = openSpace.type;
    this.value = openSpace.value;
    this.mutable = openSpace.mutable;
}

// Player item
exports.PlayerItem = function(name) {
    var player = new GenericItem("Player", name.charAt(name.length - 1));
    this.type = player.type;
    this.value = player.value;
    this.mutable = player.mutable;
}

// Bomb item
exports.BombItem = function(timer) {
    var softBlock = new GenericItem("Bomb", 'Q');
    this.type = softBlock.type;
    this.value = softBlock.value;
    this.mutable = softBlock.mutable;
    this.timer = timer || 5;
}
