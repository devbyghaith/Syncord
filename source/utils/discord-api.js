const DiscordSettings = require('../../settings/discord');

const { REST } = require('@discordjs/rest');

var API = new REST({ version: "9" });

API.setToken(DiscordSettings.Token);

module.exports = API;