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

exports.removePlayer = function(player) {
    var i = 0;
    while (i < queue.length) {
        if (queue[i] === player) {
            queue.splice(i, 1);
        } else {
            ++i;
        }
    }
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

exports.getQueue = function() {
    return queue;
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
