var queue = [];

exports.addPlayer = function(player) {
    queue.push(player);
}

exports.moveFirstToBack = function() {
    var player = queue.shift();
    queue.push(player);
}

exports.removeFirst = function() {
    queue.shift();
}

exports.getConnectedPlayer = function() {
    for (var i = 0; i < queue.length; ++i) {
        if (queue[0].connected) {
            return queue[0];
        }
        this.moveFirstToBack();
    }
    return null;
}

exports.toString = function() {
    var str = "";

    queue.forEach(function(player) {
        if (str) {
            str += ", ";
        }
        str += player;
        if (!player.connected) {
            str += "*";
        }
    });

    return str;
}
