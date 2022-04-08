const DiscordJS = require('discord.js');
const Path = require('path');
const Fs = require('fs');

class Client extends DiscordJS.Client {
    constructor(options) {
        super(options);

        this.commands = new DiscordJS.Collection();
        this.aliases = new DiscordJS.Collection();
    };

    loadCommands(directoryPath) {
        if (!directoryPath) directoryPath = Path.join(__dirname, 'commands');
        if (Fs.existsSync(directoryPath)) {
            Fs.readdirSync(directoryPath)
            .forEach((directoryFile) => {
                let filePath = Path.join(directoryPath, directoryFile);
                let fileStat = Fs.lstatSync(filePath);
                
                if (fileStat.isDirectory()) this.loadCommands(filePath);
                else {
                    let command = require(filePath);

                    if (command?.trigger) {
                        if (this.commands.has(command.trigger) || this.aliases.has(command.trigger)) console.log(("HANDLER"), ("COMMANDS"), (`<${command.trigger}> has already been registered as a <command.${this.commands.has(command.trigger) ? "trigger" : "alias"}>`));
                        else { 
                            this.commands.set(command.trigger, command);

                            if (command.aliases) {
                                if (Array.isArray(command.aliases)) {
                                    command.aliases.forEach((alias) => {
                                        if (!this.commands.has(alias) && !this.aliases.has(alias)) this.aliases.set(alias, command.trigger);
                                    });
                                } else if (!this.commands.has(command.aliases) && !this.aliases.has(command.aliases)) this.aliases.set(command.aliases, command.trigger);
                            };
                        };
                    } else console.log(("HANDLER"), ("COMMANDS"), (`No <command.trigger> specified in <${directoryFile}>`));
                };
            });
        } else console.log(("HANDLER"), ("COMMANDS"), (`<${directoryPath}> does not exist`));
    };

    loadEvents(directoryPath) {
        if (!directoryPath) directoryPath = Path.join(__dirname, 'events');
        if (Fs.existsSync(directoryPath)) {
            Fs.readdirSync(directoryPath)
            .forEach((directoryFile) => {
                let filePath = Path.join(directoryPath, directoryFile);
                let fileStat = Fs.lstatSync(filePath);
                
                if (fileStat.isDirectory()) this.loadCommands(filePath);
                else {
                    let event = require(filePath);

                    if (event?.type) this[event.once ? "once" : "on"](event.type, event.execute.bind(null, this));
                    else console.log(("HANDLER"), ("EVENTS"), (`No <event.type> specified in <${directoryFile}>`));
                };
            });
        } else console.log(("HANDLER"), ("EVENTS"), (`<${directoryPath}> does not exist`));
    };
};

module.exports = Client;