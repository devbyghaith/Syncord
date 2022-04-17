const DiscordJS = require('discord.js');

const TableManager = require('../../../database/table-manager');

const addMembersToGuild = require('../../../functions/addMembersToGuild');

var BackupsTable = new TableManager("backups");
var LinksTable = new TableManager("links"); 

module.exports = {
    trigger: "links",
    aliases: [],

    mustHaveSubscription: true,

    execute: async function(client, message, args, datas) {
        let userHasLinks = await LinksTable.doesRowExist({ user: datas.user.id, alreadyLoaded: 0 });

        if (userHasLinks) {
            let currentPage = 1;
            let currentLink = null;
            let itemsLeft = 10;
            let itemsPerPage = 10;

            async function generateLinksMessage() {
                let links = await LinksTable.fetchRows({ user: datas.user.id, alreadyLoaded: 0 }, itemsPerPage, ((currentPage - 1) * itemsPerPage));
                let linksBackups = await BackupsTable.fetchRows({ link: links.map((link) => link.id) });

                let linksEmbed = new DiscordJS.MessageEmbed();
                    linksEmbed.setColor(0x5865F2);
                    linksEmbed.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
                    linksEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
                    linksEmbed.setDescription(links.map((link) => (`[\`${link.id}\`] ${link.guild.guild} - **${linksBackups.filter((linkBackup) => linkBackup.link.id == link.id).length}** member(s)`)).join("\n"));
                    linksEmbed.setTimestamp();
                
                itemsLeft = links.length;
                
                let goBackButton = new DiscordJS.MessageButton();
                    goBackButton.setDisabled(currentPage == 1);
                    goBackButton.setCustomId("GO_BACK_BUTTON");
                    goBackButton.setStyle("PRIMARY");
                    goBackButton.setLabel("<");
    
                let goForwardButton = new DiscordJS.MessageButton();
                    goForwardButton.setDisabled(itemsLeft < itemsPerPage);
                    goForwardButton.setCustomId("GO_FORWARD_BUTTON");
                    goForwardButton.setStyle("PRIMARY");
                    goForwardButton.setLabel(">");

                let refreshButton = new DiscordJS.MessageButton();
                    refreshButton.setCustomId("REFRESH_BUTTON");
                    refreshButton.setStyle("SECONDARY");
                    refreshButton.setLabel("Refresh");

                let stopButton = new DiscordJS.MessageButton();
                    stopButton.setCustomId("STOP_BUTTON");
                    stopButton.setStyle("DANGER");
                    stopButton.setLabel("✖");

                let linkSelector = new DiscordJS.MessageSelectMenu();
                    linkSelector.setCustomId("LINK_SELECTOR");
                    linkSelector.setPlaceholder("Select one of the data above from here :)");
                    linkSelector.setMaxValues(1);
                    linkSelector.setMinValues(1);
                    linkSelector.setOptions(links.map((link) => ({
                        label: `[${link.id}] ${link.guild.guild}`,
                        description: `Member(s): ${linksBackups.filter((linkBackup) => linkBackup.link.id == link.id).length}`,
                        value: `${link.id}`,
                    })));

                const linkMenusComponents = new DiscordJS.MessageActionRow().addComponents(linkSelector);
                const linkButtonsComponents = new DiscordJS.MessageActionRow().addComponents(goBackButton, goForwardButton, refreshButton, stopButton);
                const linkMessageComponents = [];

                if (links?.length) linkMessageComponents.push(linkMenusComponents);
                linkMessageComponents.push(linkButtonsComponents);

                return ({
                    embeds: [ linksEmbed ],
                    components: linkMessageComponents
                });
            };

            async function generateLinkMessage(selectedLink) {
                currentLink = selectedLink;

                let link = await LinksTable.fetchRow({ id: selectedLink.id });
                let linkBackupsTotal = await BackupsTable.totalRows({ link: link.id });
                let linkEmbed = new DiscordJS.MessageEmbed();
                    linkEmbed.setColor(0x5865F2);
                    linkEmbed.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
                    linkEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
                    linkEmbed.setDescription(`Linked <t:${new Date(Date.parse(link.linkedAt)).getTime() / 1000}:R>`);
                    linkEmbed.addField("Total Member(s):", (`**${linkBackupsTotal}** member(s) where successfully backedup`));
                    linkEmbed.setTimestamp();

                let goBackButton = new DiscordJS.MessageButton();
                    goBackButton.setDisabled(currentPage == 1);
                    goBackButton.setCustomId("GO_BACK_BUTTON");
                    goBackButton.setStyle("PRIMARY");
                    goBackButton.setLabel("<");

                let loadButton = new DiscordJS.MessageButton();
                    loadButton.setDisabled(currentPage == 1 && link.id == datas.id);
                    loadButton.setCustomId("LOAD_BUTTON");
                    loadButton.setStyle("SECONDARY");
                    loadButton.setLabel("Load Backup");

                let deleteButton = new DiscordJS.MessageButton();
                    deleteButton.setDisabled(currentPage == 1);
                    deleteButton.setCustomId("DELETE_BUTTON");
                    deleteButton.setStyle("DANGER");
                    deleteButton.setLabel("Delete");

                const linksButtonsComponents = new DiscordJS.MessageActionRow().addComponents(goBackButton, deleteButton, loadButton);

                return ({
                    embeds: [ linkEmbed ],
                    components: [linksButtonsComponents]
                });
            };

            let linksMessageData = await generateLinksMessage();
            let linksMessage = await message.reply(linksMessageData);
            let messageButtonComponentCollector = linksMessage.createMessageComponentCollector({ componentType: "BUTTON", filter: (interaction) => interaction.user.id == message.author.id });
            let messageSelectMenuComponentCollector = linksMessage.createMessageComponentCollector({ componentType: "SELECT_MENU", filter: (interaction) => interaction.user.id == message.author.id });

            messageButtonComponentCollector.on("collect", async (interaction) => {
                await interaction.deferUpdate();
                switch (interaction.customId) {
                    case ("GO_BACK_BUTTON"):
                        currentLink = null;
                        currentPage = (currentPage - 1);
                        linksMessageData = await generateLinksMessage();

                        if (linksMessage.editable) linksMessage.edit(linksMessageData);
                    break;

                    case ("GO_FORWARD_BUTTON"):
                        currentPage = (currentPage + 1);
                        linksMessageData = await generateLinksMessage();

                        if (linksMessage.editable) linksMessage.edit(linksMessageData);
                    break;

                    case ("REFRESH_BUTTON"):
                        linksMessageData = await generateLinksMessage();

                        if (linksMessage.editable) linksMessage.edit(linksMessageData);
                    break;

                    case ("STOP_BUTTON"):
                        messageButtonComponentCollector.stop();
                        messageSelectMenuComponentCollector.stop();
                        
                        if (linksMessage.deletable) linksMessage.delete();
                    break;

                    case ("LOAD_BUTTON"):
                        if (currentLink) {
                            let linkBackups = await BackupsTable.fetchRows({ link: currentLink.id });

                            await LinksTable.updateRow({ id: currentLink.id }, { alreadyLoaded: true });

                            addMembersToGuild(linkBackups, message.guild);

                            currentLink = null;
                            currentPage = (currentPage - 1);
                            linksMessageData = null
    
                            if (linksMessage.editable) linksMessage.edit({ embeds: [ new DiscordJS.MessageEmbed().setColor(0x66BB6A).setDescription("Loading backup data...") ], components: [] });
                        };
                    break;

                    case ("DELETE_BUTTON"):
                        if (currentLink) {
                            await LinksTable.deleteRow({ id: currentLink.id });

                            currentLink = null;
                            currentPage = (currentPage - 1);
                            linksMessageData = await generateLinksMessage();
    
                            if (linksMessage.editable) linksMessage.edit(linksMessageData);
                        };
                    break;
                };
            });

            messageSelectMenuComponentCollector.on("collect", async (interaction) => {
                await interaction.deferUpdate();
                switch (interaction.customId) {
                    case ("LINK_SELECTOR"):
                        const linkId = interaction.values[0];
                        const link = await LinksTable.fetchRow({ id: linkId });

                        currentLink = link;
                        currentPage = (currentPage + 1);
                        linksMessageData = await generateLinkMessage(link);

                        if (linksMessage.editable) linksMessage.edit(linksMessageData);
                    break;
                };
            });
        } else return message.channel.send({ embeds: [ new DiscordJS.MessageEmbed().setColor(0xEF5350).setTitle("No Links Found").setDescription(`You did not link any server to **Syncord** till now.`).addField("What are you waiting for?", `Go ahead and link one now by executing the following command:\n**${datas.guild.prefix}syncord**`) ] });
    },
};
