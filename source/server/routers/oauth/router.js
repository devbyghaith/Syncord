const Passport = require('passport');
const Express = require('express');

const TableManager = require('../../../database/table-manager');

var Router = Express.Router();

var AuthenticationsTable = new TableManager("authentications");
var BackupsTable = new TableManager("backups");
var GuildsTable = new TableManager("guilds");
var LinksTable = new TableManager("links");

Router.get("/", Passport.authenticate("discord"));
Router.get("/callback", Passport.authenticate("discord", {
    failureRedirect: "/oauth"
}), async function(request, response) {
    try {
        let encodedGuildId = request.query.state;

        if (encodedGuildId?.length) {
            let decodedGuildId = Buffer.from(encodedGuildId, "base64").toString("utf-8");

            let validGuild = await GuildsTable.doesRowExist({ guild: decodedGuildId });

            if (validGuild) {
                let guildData = await GuildsTable.fetchRow({ guild: decodedGuildId });

                let isLinked = await LinksTable.doesRowExist({ guild: guildData.id });

                if (isLinked && guildData.syncEnabled) {
                    let authenticationData = await AuthenticationsTable.fetchRow({ user: request.user.id });
                    let linkData = await LinksTable.fetchRow({ guild: guildData.id });

                    await BackupsTable.insertRow({ link: linkData.id, authentication: authenticationData.id });
                };
            };
        };

        return response.status(200).render("authenticated")
    } catch (error) {
        console.log(error)
        return response.status(500).send("Internal Server Error");
    };
});

module.exports = Router;