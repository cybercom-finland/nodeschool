process.on("message", function(state) {
    // TODO: The following is just for testing purposes
    console.log("Thinking...");
    setTimeout(function() {
        var action = "UP";
        process.send(action);
    }, Math.random() * 7000);
});
