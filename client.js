// A client

exports.run = function(address, port, name) {
    var socket = require("socket.io-client").connect(address, { port: port });

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
            if (data && data.turn) {
                console.log("Turn: " + data.turn);

                // TODO: The following is just for testing purposes
                if (Math.random() > 0.1) {
                    setTimeout(function() {
                        var response = {
                            turn: data.turn,
                            action: "UP"
                        };
                        console.log("Sending a response (turn " + data.turn + ").");
                        socket.emit("response", response);
                    }, Math.random() * 6000);
                } else {
                    console.log("Not sending a response (turn " + data.turn + ").");
                }
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
