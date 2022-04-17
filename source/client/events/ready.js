const ExpiryChecker = require("../../utils/expiry-checker");

module.exports = {
    once: true,
    type: "ready",

    execute: async function(client) {
        client.expiryChecker = new ExpiryChecker(client);
        console.log(("DISCORD"), (`Hello World! I'm logged in as ${client.user.tag}`))
    },
};