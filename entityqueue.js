var queue = [];

exports.addEntity = function(entity) {
    queue.push(entity);
}

exports.moveFirstToBack = function() {
    var entity = queue.shift();
    queue.push(entity);
}

exports.removeFirst = function() {
    queue.shift();
}

exports.removeEntity = function(entity) {
    var i = 0;
    while (i < queue.length) {
        if (queue[i] === entity) {
            queue.splice(i, 1);
        } else {
            ++i;
        }
    }
}

exports.getConnectedEntity = function() {
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

exports.shuffle = function() {
    // Fisher-Yates shuffle
    for (var i = queue.length - 1; i > 0 ; --i) {
        var  j = Math.floor(Math.random() * i);
        var temp = queue[i];
        queue[i] = queue[j];
        queue[j] = temp;
    }
}

exports.toString = function() {
    var str = "";

    queue.forEach(function(entity) {
        if (str) {
            str += ", ";
        }
        str += entity;
        if (!entity.connected) {
            str += "*";
        }
    });

    return str;
}
