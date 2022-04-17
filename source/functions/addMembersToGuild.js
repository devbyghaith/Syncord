const DiscordSettings = require('../../settings/discord');

const TableManager = require("../database/table-manager");

const RefreshOAuth2 = require('passport-oauth2-refresh');

const DiscordOAauth = require('../utils/discord-oauth');

var AuthenticationsTable = new TableManager("authentications")

module.exports = async function(backups, guild) {
    backups.forEach((backup) => {
        try {         
            RefreshOAuth2.requestNewAccessToken("discord", backup.authentication.refreshToken, async function(error, accessToken, refreshToken) {
                if (error) {
                    console.log(error);
                } else {
                    await AuthenticationsTable.updateRow({ id: backup.authentication.id }, { accessToken, refreshToken });

                    DiscordOAauth.addMember({
                        guildId: guild.id,
                        accessToken: accessToken,
                        userId: backup.authentication.user.user,
                        botToken: DiscordSettings.Token,
                    }).catch((error) => {
                        return console.log(("CATCHES"), ("MEMBERS"), (error?.message ? error.message : error));
                    });
                };
            });
        } catch (error) {
            return console.log(("CATCHES"), ("MEMBERS"), (error?.message ? error.message : error));
        };
    });
};