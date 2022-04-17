const DiscordJS = require('discord.js');

const TableManager = require('../../database/table-manager');

var GuildsTable = new TableManager("guilds");
var SubscriptionsTable = new TableManager("subscriptions");
var UsersTable = new TableManager("users");

module.exports = {
    once: false,
    type: "messageCreate",

    execute: async function(client, message) {
        if (message.author?.bot) return;
        if (!message.guildId?.length) return;
        if (!message.content?.length) return;

        let userData = await UsersTable.fetchRow({ user: message.author.id });
        let guildData = await GuildsTable.fetchRow({ guild: message.guildId });

        let prefixRegex = new RegExp((`^${guildData.prefix}`), "i");

        if (prefixRegex.test(message.content)) {
            let [ trigger, ...args ] = message.content.slice(guildData.prefix.length).trim().split(/\s+/);

            if (!trigger?.length) return;

            let command = client.commands.get(trigger) || client.commands.get(client.aliases.get(trigger));

            if (command) {
                let hasSubscription = await SubscriptionsTable.doesRowExist({ user: userData.id });
                
                if ((command.executable && command.executable instanceof Function) && !command.executable(message)) return;
                if (command.mustHaveSubscription) {
                    if (hasSubscription) {
                        let subscriptionData = await SubscriptionsTable.fetchRow({ user: userData.id });
                        let alreadyExpired = (new Date(Date.parse(subscriptionData.expiresAt)) < new Date());

                        userData.subscription = subscriptionData;

                        if (alreadyExpired) return message.reply({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setTitle("Subscription Expired").setDescription(`Your subscription has expired at **<t:${(new Date(Date.parse(subscriptionData.expiresAt)).getTime()) / 1000}:d>**. To keep using **Syncord** whithout interruption, please renew your subscription.`) ] })
                    } else return message.reply({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setTitle("No Subscription Found").setDescription(`We couldn't find a **Syncord** subscription associated with your user ID. You can purchase a [new subscription](https://discord.gg/7krYf7JTwr) or if you do have a subscription and are unable to access it, please contact [Support Team](https://discord.gg/7krYf7JTwr).`) ]});
                };

                return command.execute(client, message, args, {
                    guild: guildData,
                    user: userData,
                });
            };
        };
    },
};
