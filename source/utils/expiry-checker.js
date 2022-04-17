const DiscordJS = require('discord.js');

const TableManager = require('../database/table-manager');

var SubscriptionsTable = new TableManager("subscriptions");

function getDaysArray(start, end) {
    for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt));
    };

    return arr;
};

class ExpiryChecker {
    constructor(client) {
        this.client = client;
        this.lastRemider = new Date();
        this.staffChannel = client.channels.cache.get("965270427914076161");

        this.checkExpiry();
        
        setTimeout(() => {
            this.checkExpiry();
            setInterval(this.checkExpiry, 24 * 60 * 60 * 1000);
        }, (new Date().setHours(24, 0, 0, 0) - Date.now()))
    };

    async checkExpiry() {
        let subscriptions = await SubscriptionsTable.fetchRows();

        if (subscriptions?.length) {
            subscriptions.filter((subscription) => subscription.expiresAt && getDaysArray(new Date(), new Date(Date.parse(subscription.expiresAt)))?.length <= 3).forEach((subscription) => {
                let daysDifference = getDaysArray(new Date(), new Date(Date.parse(subscription.expiresAt))).length;

                switch (daysDifference) {
                    case (0):
                    case (1):
                        if ((new Date(Date.parse(subscription.expiresAt)).getTime() - Date.now()) <= 0) return;

                        setTimeout(() => {
                            let expiredEmbed = new DiscordJS.MessageEmbed();
                                expiredEmbed.setColor(0xEF5350);
                                expiredEmbed.setTitle("Expiry Checker");
                                expiredEmbed.setDescription(`Your subscription has expired. To get a new subscription contact our [Support Team](https://discord.gg/7krYf7JTwr).`);
                                expiredEmbed.setTimestamp();

                            let staffExpiredEmbed = new DiscordJS.MessageEmbed();
                                staffExpiredEmbed.setColor(0xEF5350);
                                staffExpiredEmbed.setTitle("Expiry Checker");
                                staffExpiredEmbed.setDescription(`<@${subscription.user.user}>'s subscription expired at **<t:${(new Date(Date.parse(subscription.expiresAt)).getTime()) / 1000}:d>**`);
                                staffExpiredEmbed.setTimestamp();
                            this.client.users.fetch(subscription.user.user, { cache: true }).then((user) => {
                                user.send({ embeds: [ expiredEmbed ] }).then(async () => {
                                    staffExpiredEmbed.addField("Sent Notification?", "Yes");
                                    this.staffChannel?.send({ embeds: [ staffExpiredEmbed ] });
                                }).catch(() => {
                                    staffExpiredEmbed.addField("Sent Notification?", "No. Couldn't send notification.");
                                    this.staffChannel?.send({ embeds: [ staffExpiredEmbed ] });
                                });
                            }).catch(() => {
                                staffExpiredEmbed.addField("Sent Notification?", "No. Couldn't find user.");
                                this.staffChannel?.send({ embeds: [ staffExpiredEmbed ] });
                            });
                        }, (new Date(Date.parse(subscription.expiresAt)).getTime() - Date.now()));
                    break;

                    case (2):
                    case (3):
                    case (4):
                        let expireEmbed = new DiscordJS.MessageEmbed();
                            expireEmbed.setColor(0xFFEE55);
                            expireEmbed.setTitle(`Expiry Checker`);
                            expireEmbed.setDescription(`Your subscription expires in **${daysDifference - 1}** day(s). Your subscription will **NOT** automatically renew.`);
                            expireEmbed.setTimestamp();

                        let staffExpireEmbed = new DiscordJS.MessageEmbed();
                            staffExpireEmbed.setColor(0xFFEE55);
                            staffExpireEmbed.setTitle(`Expiry Checker`);
                            staffExpireEmbed.setDescription(`<@${subscription.user.user}>'s subscription will expire in **${daysDifference - 1}** day(s)`);
                        this.client.users.fetch(subscription.user.user, { cache: true }).then((user) => {
                            user.send({ embeds: [ expireEmbed ] }).then(() => {
                                staffExpireEmbed.addField("Sent Notification?", "Yes");
                                this.staffChannel?.send({ embeds: [ staffExpireEmbed ] });
                            }).catch(() => {
                                staffExpireEmbed.addField("Sent Notification?", "No. Couldn't send notification.");
                                this.staffChannel?.send({ embeds: [ staffExpireEmbed ] });
                            });
                        }).catch(() => {
                            staffExpireEmbed.addField("Sent Notification?", "No. Couldn't find user.");
                            this.staffChannel?.send({ embeds: [ staffExpireEmbed ] });
                        });
                    break;
                };
            });
        };
    };
};

module.exports = ExpiryChecker;