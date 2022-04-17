if (console.clear && console.clear instanceof Function) console.clear();

const DiscordSettings = require("../settings/discord");
const ExpressSettings = require("../settings/express");

const Server = require("./server");
const Client = require("./client");

var ExtendedClient = new Client(DiscordSettings.Super);
var WebServer = new Server();

ExtendedClient.loadEvents();
ExtendedClient.loadCommands();
ExtendedClient.login(DiscordSettings.Token).catch((error) => {
    console.log(("DISCORD"), (`Unable to login with Discord`));
    console.log(("DISCORD"), (error?.message ? error.message : error));
});

WebServer.registerRouters();
WebServer.app.listen(ExpressSettings.Port, ExpressSettings.Host, () => {
    console.log(("EXPRESS"), (`Listening to requests on <${ExpressSettings.Host}:${ExpressSettings.Port}>`));
});
