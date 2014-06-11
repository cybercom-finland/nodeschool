// A client

var cp = require('child_process');
var socket;
var aiProcess;

exports.run = function(address, port, name) {
    socket = require("socket.io-client").connect(address, { port: port });

    socket.on("connect", function() {
        console.log("Connection established.");

        // Send client's name to the server
        socket.emit("setname", name);

        // Handle disconnection
        socket.on("disconnect", function() {
            console.log("Disconnected from the server.");
            process.exit(0);
        });

        // The server sends the world state
        socket.on("state", function(data) {
            console.log();

            if (data && data.world) {
                // Print the received world for debugging purposes
                console.log("World:");
                for (var y = 0; y < data.world[0].length; y++) {
                    var line = "    ";
                    for (var x = 0; x < data.world.length; x++) {
                        line += data.world[x][y];
                    }
                    console.log(line);
                }
            }
            if (data && data.coordinates) {
                // Print the received world for debugging purposes
                console.log("Coordinates: " + JSON.stringify(data.coordinates));
            }
            if (data && data.turn) {
                console.log("Turn: " + data.turn);
                handleTurn(data);
            } else {
                // If initial world (at connection time) is received and it is someone else's turn,
                // data.turn === null
                console.log("Not my turn");
            }
        });

        // The server sends the timeout signal
        socket.on("timeout", onTimeout);
    });

    // Handle connection errors
    socket.on("error", function() {
        console.error("Connection failed!");
        process.exit(1);
    });

    // Handle Ctrl+C
    process.on("SIGINT", function() {
        // Disconnect cleanly
        socket.disconnect();
        process.exit();
    });
};

function handleTurn(data) {
    if (!socket) {
        return;
    }

    // Create a new process for AI
    aiProcess = cp.fork(__dirname + "/ai.js");

    // AI sends a response
    aiProcess.on("message", function(action) {
        // Kill the process
        aiProcess.kill();
        aiProcess = null;

        // Send the response to the server
        var response = {
            turn: data.turn,
            action: action
        };

        console.log("Sending a response (turn " + data.turn + ").");
        socket.emit("response", response);
    });

    // Send the world state to the AI process
    aiProcess.send(data);
}

function onTimeout() {
    console.log("Time's up!");

    // Stop the AI process
    if (aiProcess) {
        aiProcess.kill();
    }
}
