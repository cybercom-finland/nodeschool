// A client

var TIMEOUT = 5000;

var cp = require('child_process');
var socket;

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

        socket.on("state", function(data) {
            console.log();

            if (data && data.world) {
                // Print the received world for debugging purposes
                console.log("World:");
                for (var i = 0; i < data.world.length; i++) {
                    var line = "    ";
                    for (var j = 0; j < data.world[i].length; j++) {
                        line += data.world[i][j];
                    }
                    console.log(line);
                }
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
    var aiProcess = cp.fork(__dirname + "/ai.js");
    var timeoutTimer;

    // AI sends a response
    aiProcess.on("message", function(action) {
        // Kill the process and stop the timer
        aiProcess.kill();
        clearTimeout(timeoutTimer);
        timeoutTimer = null;

        // Send the response to the server
        var response = {
            turn: data.turn,
            action: action
        };

        console.log("Sending a response (turn " + data.turn + ").");
        socket.emit("response", response);
    });

    // A timer to handle timeout
    timeoutTimer = setTimeout(function() {
        console.log("Time's up!");
        aiProcess.kill();
    }, TIMEOUT);

    // Send the world state to the AI process
    aiProcess.send(data);
}
