// Receives a world state from the server
process.on("message", function(state) {
    // TODO: The following is just for testing purposes
    console.log("Thinking...");
    setTimeout(function() {
        var action;

        var rand = Math.floor(Math.random() * 5);
        if (rand === 0) action = "UP";
        else if (rand === 1) action = "RIGHT";
        else if (rand === 2) action = "DOWN";
        else if (rand === 3) action = "LEFT";
        else action = "BOMB";

        process.send(action);
    }, Math.random() * 3000);
});
