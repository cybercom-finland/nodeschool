var players = {};

function onWorldState(state) {
    // TODO: Draw static objects
    console.log(state);
}

function onAddPlayer(name, coords) {
    console.log("Player", name, "added:", coords.x, coords.y);
    players[name] = {
        x: coords.x,
        y: coords.y
    };
}

function onMovePlayer(name, coords) {
    console.log("Player", name, "moved:", players[name].x, players[name].y, "->", coords.x, coords.y);
    players[name].x = coords.x;
    players[name].y = coords.y;
}

window.onload = function() {
    var socket = io.connect();

    // Inform the server that we want to receive visualization messages
    socket.emit("startvisualization");

    socket.on("worldstate", onWorldState);
    socket.on("addplayer", onAddPlayer);
    socket.on("moveplayer", onMovePlayer);
};
