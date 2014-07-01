// Receives a world state from the server
process.on("message", function(state) {
    // TODO: The following is just for testing purposes
    console.log("Thinking...");

    var x = state.coordinates.x;
    var y = state.coordinates.y;

    var action = "";
    var counter = 0;

    while (!action && counter < 10) {
        ++counter;
        var rand = Math.floor(Math.random() * 5);

        if (rand === 0 && state.world[x][y - 1].free) action = "UP";
        else if (rand === 1 && state.world[x + 1][y].free) action = "RIGHT";
        else if (rand === 2 && state.world[x][y + 1].free) action = "DOWN";
        else if (rand === 3 && state.world[x - 1][y].free) action = "LEFT";
        else if (rand === 4 && state.bombsAvailable > 0) action = "BOMB";
    }

    process.send(action);
});
