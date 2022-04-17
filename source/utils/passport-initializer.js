const OAuthSettings = require("../../settings/oauth");

const TableManager = require("../database/table-manager");

const RefreshOAuth2 = require('passport-oauth2-refresh');
const DiscordPassport = require("passport-discord");

var AuthenticationsManager = new TableManager("authentications");
var UsersManager = new TableManager("users");

module.exports = function(passport) {
    let discordStrategy = new DiscordPassport.Strategy({
        clientID: OAuthSettings.Client.Id,
        clientSecret: OAuthSettings.Client.Secret,
        callbackURL: OAuthSettings.Callback,
        scope: OAuthSettings.Scopes,
    }, async function(accessToken, refreshToken, discordProfile, done) {
        try {
            let user = await UsersManager.fetchRow({ user: discordProfile.id });

            await AuthenticationsManager.updateRow({ user: user.id }, { user: user.id, accessToken, refreshToken });

            return done(null, user)
        } catch (error) {
            return done("Internal Server error");
        };
    })

    passport.use(discordStrategy);
    RefreshOAuth2.use(discordStrategy);

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            let doesExist = await UsersManager.doesRowExist({ id: id });

            if (doesExist) done(null, (await UsersManager.fetchRow({ id: id })));
            else done(null, null);
        } catch (error) {
            return done("Internal Server error", null);
        };
    });
};
