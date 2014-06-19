// A client

var clc = require("cli-color");
var cp = require("child_process");
var socket;
var currentTurn;

exports.run = function(address, port, name) {
    socket = require("socket.io-client").connect(address, { port: port });

    // Create a new process for AI
    initializeAIProcess();

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
                        var c = data.world[x][y].value;
                        if (c === "#") {
                            line += c;
                        } else if (c === "X") {
                            line += clc.blackBright(c);
                        } else if (data.coordinates.x === x && data.coordinates.y === y) {
                            line += clc.yellowBright("P");
                        } else {
                            c = " ";
                            for (var i = 0; i < data.enemies.length; ++i) {
                                if (data.enemies[i].coordinates.x === x && data.enemies[i].coordinates.y === y) {
                                    c = clc.yellowBright("E");
                                    break;
                                }
                            }
                            if (c === " ") {
                                for (var i = 0; i < data.bombs.length; ++i) {
                                    if (data.bombs[i].coordinates.x === x && data.bombs[i].coordinates.y === y) {
                                        c = clc.redBright(data.bombs[i].timer);
                                        break;
                                    }
                                }
                            }

                            line += c;
                        }
                    }
                    console.log(line);
                }
            }
            if (data && data.coordinates) {
                // Print the received world for debugging purposes
                console.log("Coordinates: " + JSON.stringify(data.coordinates));
            }
            if (data && data.turn) {
                console.log("Turn: " + data.turn + ", score: " + data.score);
                currentTurn = data.turn;
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

// Initializes the AI
function initializeAIProcess() {
    aiProcess = cp.fork(__dirname + "/ai.js");

    // AI sends a response
    aiProcess.on("message", function(action) {
        // Send the response to the server
        var response = {
            turn: currentTurn,
            action: action
        };

        console.log("Sending a response: " + action);
        socket.emit("response", response);
    });

    // AI exits
    aiProcess.on("exit", function() {
        // Disconnect cleanly
        socket.disconnect();
        process.exit(1);
    });
    aiProcess.on("error", function(err) {
        // Disconnect cleanly
        socket.disconnect();
        process.exit(1);
    });
}

// Handles one turn
function handleTurn(data) {
    // Send the world state to the AI process
    if (aiProcess) {
        aiProcess.send(data);
    } else {
        console.error("AI process does not exist!");
        process.exit(1);
    }
}

// Called when the server sends a timeout signal
function onTimeout() {
    console.log("Time's up!");

    // Disconnect from the server
    if (socket) {
        socket.disconnect();
    }

    process.exit();
}
