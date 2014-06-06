var fs = require("fs");

var configFilename;
if (process.argv.length === 3) {
    // A configuration file was given as a command line parameter
    configFilename = "./" + process.argv[2];
} else {
    // Use a default file
    configFilename = "./config.json";
}

// Read the configuration file
if (!fs.existsSync(configFilename)) {
    console.error("Configuration file not found.");
    process.exit(1);
}
var config = require(configFilename);


if (config.judge) {
    // Start a server
    var server = require("./server.js");
    server.run(config.port);
} else {
    // Start a client
    var client = require("./client.js");
    client.run(config.address, config.port, config.name);
}
