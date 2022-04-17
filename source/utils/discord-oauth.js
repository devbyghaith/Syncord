const OAuthSettings = require('../../settings/oauth');

const DiscordOauth2 = require("discord-oauth2");

const OAuth = new DiscordOauth2({
	clientId: OAuthSettings.Client.Id,
	clientSecret: OAuthSettings.Client.Secret,
	redirectUri: OAuthSettings.Callback,
});

module.exports = OAuth;