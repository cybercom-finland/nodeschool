var queue = [];

exports.addPlayer = function(player) {
    queue.push(player);
}

exports.moveFirstToBack = function() {
    var player = queue.shift();
    queue.push(player);
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

exports.print = function() {
    var str = "Queue:";

    queue.forEach(function(player) {
        str += " " + player.name;
        if (!player.connected) {
            str += "*";
        }
    });

    console.log(str);
}
