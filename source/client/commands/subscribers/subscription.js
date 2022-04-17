const DiscordJS = require('discord.js');

const TableManager = require('../../../database/table-manager');

var SubscriptionsTable = new TableManager("subscriptions"); 

module.exports = {
    trigger: "subscription",
    aliases: [],

    mustHaveSubscription: true,

    execute: async function(client, message, args, datas) {
        let subscriptionData = await SubscriptionsTable.fetchRow({ user: datas.user.id });
        let subscriptionEmbed = new DiscordJS.MessageEmbed();
            subscriptionEmbed.setColor(0x5865F2);
            subscriptionEmbed.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
            subscriptionEmbed.setTitle("Subscription Details");
            subscriptionEmbed.setDescription(`Current plan: **${subscriptionData.plan.name}**`);
            subscriptionEmbed.addField("Activation date:", (`**<t:${(new Date(Date.parse(subscriptionData.startedAt)).getTime()) / 1000}:d>**\n`), true);
        if (subscriptionData.expiresAt) subscriptionEmbed.addField("Expiration date:", (`**<t:${(new Date(Date.parse(subscriptionData.expiresAt)).getTime()) / 1000}:d>**\n`), true);
            subscriptionEmbed.addField("Subscription Cost:", (`**${subscriptionData.plan.costs / 100}$**`), true);
            subscriptionEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
            subscriptionEmbed.setTimestamp();
        return message.reply({ embeds: [ subscriptionEmbed ] });
    },
};
