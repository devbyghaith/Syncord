const DiscordJS = require('discord.js');

const TableManager = require('../../../database/table-manager');

var BackupsTable = new TableManager("backups");
var MessagesTable = new TableManager("messages");
var GuildsTable = new TableManager("guilds");
var LinksTable = new TableManager("links");

var toggleGuildSync = (guild, status) => new Promise(async (resolve, reject) => {
    try {
        await GuildsTable.updateRow({ id: guild.id }, { syncEnabled: status ? 1 : 0 });

        return resolve({ ...guild, syncEnabled: status ? 1 : 0 });
    } catch (error) {
        return reject(error);  
    };
});

var linkGuildToUser = (user, guild) => new Promise(async (resolve, reject) => {
    try {
        let isAlreadyLinked = await LinksTable.doesRowExist({ user: user.id, guild: guild.id });

        if (isAlreadyLinked) return resolve();
        else {
            await LinksTable.insertRow({ user: user.id, guild: guild.id });

            return resolve();
        };
    } catch (error) {
        return reject(error); 
    };
});

module.exports = {
    trigger: "syncord",
    aliases: ["sc"],
	
	mustHaveSubscription: true,
    
    executable: (message) => message.guild.ownerId == message.author.id,
    execute: async function(client, message, args, datas) {        
        try {
            let argument = args[0];
            
            let isGuildLinked = await LinksTable.doesRowExist({ guild: datas.guild.id });
            let totalUserLinks = await LinksTable.totalRows({ user: datas.user.id });

            if (message.deletable) message.delete();
            if (isGuildLinked) {
                let guildLink = await LinksTable.fetchRow({ guild: datas.guild.id });
                
                if (argument?.length) {
                    switch (argument.toLowerCase()) {
                        case ("message"):
                            let urlArgument = args[1];
                            let urlRegex = (/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/);
        
                            if (urlArgument?.length) {
                                if (urlRegex.test(urlArgument)) {
                                    try {
                                        let urlData = new URL(urlArgument);
                                        
                                        if (urlData.host == "discohook.org" && urlData.searchParams.has("data")) {
                                            let data = urlData.searchParams.get("data");
                                            let decodedData = Buffer.from(data, "base64").toString("utf-8");
                                            let dataToJson = JSON.parse(decodedData);
                                            let messageData = dataToJson?.messages?.[0]?.data;
                        
                                            if (messageData) {
                                                let messageDataToJson = JSON.stringify(messageData);
                                                
                                                let previewMessage = await message.channel.send({ embeds: messageData?.embeds?.length ? messageData.embeds : [], content: messageData.content });
                                                let yesButton = new DiscordJS.MessageButton();
                                                    yesButton.setStyle("SUCCESS");
                                                    yesButton.setCustomId("CONFIRM_BUTTON");
                                                    yesButton.setLabel("Yes");
                                                let noButton = new DiscordJS.MessageButton();
                                                    noButton.setStyle("DANGER");
                                                    noButton.setCustomId("ABORT_BUTTON")
                                                    noButton.setLabel("No");
        
                                                let confirmationMessage = await previewMessage.reply({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xFFEE55).setDescription("Do you want to set this as a message?") ], components: [ new DiscordJS.MessageActionRow().addComponents(yesButton, noButton) ] })
                                                let confirmationInteraction = await confirmationMessage.awaitMessageComponent({ filter: (interaction) => interaction.user.id == message.author.id, limit: 1, time: 60000 })
                                                
                                                switch (confirmationInteraction.customId) {
                                                    case ("CONFIRM_BUTTON"):
                                                        await MessagesTable.updateRow({ guild: datas.guild.id }, { guild: datas.guild.id, message: messageDataToJson });
                                                        
                                                        if (previewMessage.deletable) previewMessage.delete();
                                                        
                                                        return confirmationMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0x66BB6A).setDescription(`Successfully updated your message`) ], components: [] });
                                                    break;
        
                                                    case ("ABORT_BUTTON"):
                                                        return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`OK`) ] });
                                                    break;
                                                };
                                            } else return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Invalid message link specified`) ] });
                                        } else return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Invalid message link specified`) ] });
                                    } catch (error) {
                                        return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Unexpected error occurred. Please try again later.`) ] });
                                    };
                                } else return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Invalid message link specified`) ] });
                            } else {
                                let guildMessage = await MessagesTable.fetchRow({ guild: datas.guild.id });
                                
                                if (guildMessage.message) {
                                    let verifyButton = new DiscordJS.MessageButton();
                                        verifyButton.setURL(`https://discord.com/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2Foauth%2Fcallback&scope=identify%20guilds%20guilds.join&client_id=965021447305166929&state=${Buffer.from(message.guildId).toString("base64")}`);
                                        verifyButton.setLabel("Verify");
                                        verifyButton.setStyle("LINK");
                                    return message.channel.send({ embeds: guildMessage.message?.embeds?.length ? guildMessage.message.embeds : [], content: guildMessage.message.content, components: [ new DiscordJS.MessageActionRow().addComponents(verifyButton) ] });
                                } else return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setTitle("No Message Set").setDescription(`No message set, please build your message at [Discohook](https://discohook.org/?data=eyJtZXNzYWdlcyI6W3siZGF0YSI6eyJjb250ZW50IjpudWxsLCJlbWJlZHMiOm51bGwsImF0dGFjaG1lbnRzIjpbXX19XX0) and set it as a message by executing the following command:\n**${datas.guild.prefix}syncord message <your_discohook_url>**`) ] });
                            };
                        break;
                    };
                } else {
                    let backupMembers = await BackupsTable.totalRows({ link: guildLink.id });
                    let syncordEmbed = new DiscordJS.MessageEmbed();
                        syncordEmbed.setColor(0x5865F2);
                        syncordEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
                        syncordEmbed.setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
                        syncordEmbed.setDescription(`Syncord is **${datas?.guild?.syncEnabled ? "enabled" : "disabled"}**`);
                    if (datas?.guild?.syncEnabled) syncordEmbed.addField("Information(s):", (`Total stored member(s): **${backupMembers}**`));
                        syncordEmbed.setTimestamp();
                    
                    let toggleGuildSyncButton = new DiscordJS.MessageButton();
                        toggleGuildSyncButton.setStyle(datas?.guild?.syncEnabled ? "DANGER" : "SUCCESS");
                        toggleGuildSyncButton.setLabel(datas?.guild?.syncEnabled ? "Disable Syncord" : "Enable Syncord");
                        toggleGuildSyncButton.setCustomId("TOGGLE_GUILD_SYNC");
        
                    let syncordMessage = await message.channel.send({ embeds: [ syncordEmbed ], components: [ new DiscordJS.MessageActionRow().addComponents(toggleGuildSyncButton) ] });
                    let syncordCollector = await syncordMessage.awaitMessageComponent({ filter: (interaction) => interaction.user.id == message.author.id, limit: 1, time: 60000 })

                    try {
                        await toggleGuildSync(datas.guild, !datas?.guild?.syncEnabled);
    
                        return syncordMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0x66BB6A).setDescription(`Syncord was successfully **${datas?.guild?.syncEnabled ? "disabled" : "enabled"}**`) ], components: [] });
                    } catch (error) {
                        return syncordMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Unable to **${datas?.guild?.syncEnabled ? "disable" : "enable"}** Syncord at the moment`) ], components: [] });
                    };
                };
            } else {
                let linkEmbed = new DiscordJS.MessageEmbed();
                    linkEmbed.setColor(0x5865F2);
                    linkEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
                    linkEmbed.setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
                    linkEmbed.setDescription(`You did not link **${message.guild.name}** with **Syncord** till now.`);
                    linkEmbed.setTimestamp();
				
                let linkButton = new DiscordJS.MessageButton();
                if (datas.user?.subscription?.plan?.limitedServers) linkButton.setDisabled(datas.user.subscription.plan.limitedServers <= totalUserLinks);
                    linkButton.setCustomId("TOGGLE_GUILD_LINK");
                    linkButton.setStyle("PRIMARY");
                    linkButton.setLabel("Link now");
                
                let linkMessage = await message.channel.send({ embeds: [ linkEmbed ], components: [ new DiscordJS.MessageActionRow().addComponents(linkButton) ] });
                let linkCollector = await linkMessage.awaitMessageComponent({ filter: (interaction) => interaction.user.id == message.author.id, limit: 1, time: 60000 });

                try {
                    await linkGuildToUser(datas.user, datas.guild);

                    return linkMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0x66BB6A).setDescription(`Syncord was successfully linked with **${message.guild.name}**`) ], components: [] });
                } catch (error) {
                    return linkMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Unable to link Syncord with **${message.guild.name}** at the moment`) ], components: [] });
                };
            };
        } catch (error) {
            return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setDescription(`Unexpected error occurred. Please try again later.`) ] });
        };
    },
};
