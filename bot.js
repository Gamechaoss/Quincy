/* External Modules */
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const AntiSpam = require("discord-anti-spam");
const winston = require("winston");
const flatted = require("flatted");

console.log(process.version);

process.send = process.send || function () {}; // avoid error when no parent process

const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user-service" },
    transports: [
        // - Write all logs with level `error` and below to `botErrors.log`
        // - Write all logs with level `info` and below to `combined.log`
        new winston.transports.File({
            filename: path.join(__dirname, "/botErrors.log"),
            level: "error",
            format: winston.format.combine(
                winston.format.timestamp({
                    format: "YYYY-MM-DD hh:mm:ss A ZZ"
                }),
                winston.format.json()
            )
        }),
        new winston.transports.File({ filename: "combined.log" })
    ]
});
const DBS = {};
DBS.Bot = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING
    ]
});

DBS.MsgHandler = require("./Handlers/Message");
DBS.EventHandler = require("./Handlers/Events");
DBS.usercache = require("./BotData/usercache");
DBS.Cache = require("./BotData/varcache");
DBS.Discord = Discord;

DBS.SettingsFile = require("./BotData/Settings/Settings.json");
DBS.RulesFile = require("./BotData/Settings/Rules.json");
DBS.EventsFile = require("./BotData/commands/events");
DBS.CommandsFile = require("./BotData/commands/commands");
DBS.UserFile = __dirname + "/BotData/user/user.json";

console.log(DBS.RulesFile.obj);
DBS.antiSpam = new AntiSpam(DBS.RulesFile.obj);

// Discord-Anti-Spam is broken so here's a temp fix
DBS.antiSpam.options.warnEnabled = DBS.RulesFile.obj.warnEnabled;
DBS.antiSpam.options.kickEnabled = DBS.RulesFile.obj.kickEnabled;
DBS.antiSpam.options.banEnabled = DBS.RulesFile.obj.banEnabled;
DBS.antiSpam.options.muteEnabled = false;
DBS.antiSpam.options.errorMessages = false;
DBS.antiSpam.options.verbose = false;

DBS.slashCommands = [];
DBS.buttons = [];
DBS.selects = [];

DBS.Mods = new Map();

DBS.loadMods = async function () {
    let dir = require("path").join(__dirname, "mods");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    require("fs")
        .readdirSync(require("path").join(__dirname, "mods"))
        .forEach(mod => {
            const fetchedMod = require(require("path").join(__dirname, `mods/${mod}`));
            fetchedMod.init(DBS);
            if (fetchedMod.isEvent) {
                DBS.Bot.on(fetchedMod.name, fetchedMod.mod.bind(null, DBS.Bot));
            } else if (fetchedMod.isResponse) {
                DBS.Mods.set(fetchedMod.name, fetchedMod);
            }
        });
};

DBS.checkMessage = async function (message) {
    const prefix = DBS.SettingsFile.prefix;
    if (message.author.bot) return;

    try {
        let messageVars = {};
        messageVars.guild = message.guild;
        messageVars.member = message.member;
        messageVars.message = message;
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Any Message", messageVars);
        if (DBS.RulesFile.enabled) {
            DBS.antiSpam.message(message);
        }

        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift();
        var hasPermission = false;

        for (const commandF of DBS.CommandsFile.command) {
            if (commandF.name == command) {
                if (!commandF.perms || commandF.perms.length === 0) {
                    hasPermission = true;
                } else {
                    // Verify permissions
                    message.member.roles.cache.forEach(role => {
                        commandF.perms.forEach(perm => {
                            if (role.name.toLowerCase() === perm.toLowerCase()) {
                                // Only execute actions if permissions check passes
                                hasPermission = true;
                            }
                        });
                    });
                }

                if (hasPermission) {
                    if (commandF.actions.length > 0) {
                        DBS.callNextAction(commandF, message, args, 0);
                    }
                }
            }
        }
        fs.writeFileSync(
            DBS.UserFile,
            JSON.stringify(DBS.usercache.memoryCache, null, 2),
            function (err) {
                if (err) return console.log(err);
            }
        );
        fs.writeFileSync(
            __dirname + "/BotData/variables/servervars.json",
            flatted.stringify(DBS.serverVars, null, 2),
            function (err) {
                if (err) return console.log(err);
            }
        );
        fs.writeFileSync(
            __dirname + "/BotData/variables/globalvars.json",
            flatted.stringify(DBS.globalVars, null, 2),
            function (err) {
                if (err) return console.log(err);
            }
        );
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Check Message: " + "[" + message.content + "] " + error.stack
        });
    }
};
/**
 * Calls the action(response) at a given index, whether a mod or standard  message handler response
 */
DBS.callNextAction = async function (command, message, args, index) {
    try {
        var action = command.actions[index];
        var fetchedAction;
        if (action) {
            if (action.type) {
                fetchedAction = DBS.Mods.get(action.type);
            } else {
                fetchedAction = null;
            }

            if (!fetchedAction) {
                var msg = message;
                //msg.content = message.content.slice(DBS.SettingsFile.prefix.length);
                DBS.MsgHandler.Message_Handle(DBS, msg, command, index, args);
            } else {
                fetchedAction.mod(DBS, message, action, args, command, index);
            }
        }
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Call next action: " + "[" + message.content + "] " + error.stack
        });
    }
};

/**
 * Calls the action(response) at a given index, whether a mod or standard event handler response
 */
DBS.callNextEventAction = async function (type, varsE, index) {
    DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, index, type, varsE);
};

DBS.startBot = async function () {
    await DBS.Bot.login(DBS.SettingsFile.token)
        .then(value => {
            process.send("success");
        })
        .catch(e => {
            DBS.logError({
                level: "error",
                message: "Bot login: " + e
            });
            //process.send("Error: " + e);
        });

    DBS.registerSlashCommands();
    DBS.registerButtonsAndSelects();
    DBS.CheckIfLoaded();
};

DBS.registerButtonsAndSelects = async function () {
    let buttonsAndSelects = deepSearchItems(DBS.CommandsFile.command, "rowtype", (k, v) => k === "rowtype");
    let eventButtonsAndSelects = deepSearchItems(DBS.EventsFile.command, "rowtype", (k, v) => k === "rowtype");
    setEphemeralStatus(buttonsAndSelects);
    setEphemeralStatus(eventButtonsAndSelects);
};

function setEphemeralStatus(buttonsAndSelects) {
    buttonsAndSelects.forEach(item => {
        if (item.rowtype === "select") { 
            let ephem = item.ephemeral ? true : false;
            DBS.selects[item.customid] = { ephemeral: ephem };
        }
        else if (item.rowtype === "button") { // this is a button
            item.buttons.forEach(button => {
                let ephem = button.ephemeral ? true : false;
                DBS.buttons[button.customid] = { ephemeral: ephem };
            });
        }
    });
}

DBS.registerSlashCommands = async function() {
    let data = [];
    DBS.CommandsFile.command.forEach(command => {
        // If this is a slash command
        if (command.description) {
            data.push(command);
            let ephem = command.ephemeral ? true : false;
            DBS.slashCommands[command.name] = { ephemeral: ephem};
        }
    });
    if (data.length > 0) {
        await DBS.Bot.application?.commands.set(data);
    }
}

DBS.LoadedGuilds = [];

DBS.CheckIfLoaded = async function () {
    DBS.Bot.guilds.cache.forEach(async (guild) => {
        if (guild.available) {
            if (!DBS.LoadedGuilds.includes(guild.name)) {
                DBS.LoadedGuilds.push(guild.name);
                var serverObj = {};
                serverObj.guild = guild;
                DBS.callNextEventAction("Bot Initialization", serverObj, 0);
            }
        } else {
            setTimeout(DBS.CheckIfLoaded, 500);
        }
    });
};

DBS.loadBot = async function () {
    await DBS.loadMods().catch(e => {
        DBS.logError({
            level: "error",
            message: "Loading mods: " + e
        });
    });
    await DBS.startBot();
};

DBS.Bot.on("messageCreate", message => DBS.checkMessage(message));
DBS.Bot.on("guildMemberAdd", member => {
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "User Joins Server", member);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild member add: " + error.stack
        });
    }
});
DBS.Bot.on("guildMemberRemove", member => {
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "User Kicked", member);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild member remove: " + error.stack
        });
    }
});
DBS.Bot.on("guildBanAdd", (guild, user) => {
    let banVars = {};
    banVars.guild = guild;
    banVars.user = user;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "User Banned", banVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild ban add: " + error.stack
        });
    }
});
DBS.Bot.on("channelCreate", channel => {
    let channelVars = {};
    channelVars.guild = channel.guild;
    channelVars.channel = channel;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Channel Create", channelVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Channel create: " + error.stack
        });
    }
});
DBS.Bot.on("channelDelete", channel => {
    let channelVars = {};
    channelVars.guild = channel.guild;
    channelVars.channel = channel;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Channel Delete", channelVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Channel delete: " + error.stack
        });
    }
});
DBS.Bot.on("channelPinsUpdate", (channel, time) => {
    let channelVars = {};
    channelVars.guild = channel.guild;
    channelVars.channel = channel;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Channel Pins Update", channelVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Channel pins update: " + error.stack
        });
    }
});
DBS.Bot.on("channelUpdate", (oldchannel, newchannel) => {
    let channelVars = {};
    channelVars.guild = newchannel.guild;
    channelVars.oldchannel = oldchannel;
    channelVars.newchannel = newchannel;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Channel Update", channelVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Channel update: " + error.stack
        });
    }
});
DBS.Bot.on("emojiCreate", emoji => {
    let emojiVars = {};
    emojiVars.guild = emoji.guild;
    emojiVars.emoji = emoji;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Emoji Create", emojiVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Emoji create: " + error.stack
        });
    }
});
DBS.Bot.on("emojiDelete", emoji => {
    let emojiVars = {};
    emojiVars.guild = emoji.guild;
    emojiVars.emoji = emoji;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Emoji Delete", emojiVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Emoji delete: " + error.stack
        });
    }
});
DBS.Bot.on("emojiUpdate", (oldemoji, newemoji) => {
    let emojiVars = {};
    emojiVars.guild = newemoji.guild;
    emojiVars.oldemoji = oldemoji;
    emojiVars.newemoji = newemoji;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Emoji Update", emojiVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Emoji update: " + error.stack
        });
    }
});
DBS.Bot.on("guildBanRemove", (guild, user) => {
    let emojiVars = {};
    emojiVars.guild = guild;
    emojiVars.user = user;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Ban Remove", emojiVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild ban remove: " + error.stack
        });
    }
});
DBS.Bot.on("guildCreate", guild => {
    let guildVars = {};
    guildVars.guild = guild;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Create", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild create: " + error.stack
        });
    }
});
DBS.Bot.on("guildDelete", guild => {
    let guildVars = {};
    guildVars.guild = guild;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Delete", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild delete: " + error.stack
        });
    }
});
DBS.Bot.on("guildMemberAvailable", member => {
    let guildVars = {};
    guildVars.guild = member.guild;
    guildVars.member = member;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Member Available", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild member available: " + error.stack
        });
    }
});
DBS.Bot.on("guildMemberSpeaking", (member, speaking) => {
    let guildVars = {};
    guildVars.guild = member.guild;
    guildVars.member = member;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Member Speaking", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild member speaking: " + error.stack
        });
    }
});
DBS.Bot.on("guildMemberUpdate", (oldmember, newmember) => {
    let guildVars = {};
    guildVars.guild = newmember.guild;
    guildVars.oldmember = oldmember;
    guildVars.newmember = newmember;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Member Update", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild member update: " + error.stack
        });
    }
});
DBS.Bot.on("guildUnavailable", guild => {
    let guildVars = {};
    guildVars.guild = guild;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Unavailable", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild unavailable: " + error.stack
        });
    }
});
DBS.Bot.on("guildUpdate", (oldguild, newguild) => {
    let guildVars = {};
    guildVars.guild = newguild;
    guildVars.oldguild = oldguild;
    guildVars.newguild = newguild;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Guild Update", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Guild update: " + error.stack
        });
    }
});
DBS.Bot.on("messageDelete", message => {
    console.log("message deleted");
    let guildVars = {};
    guildVars.guild = message.guild;
    guildVars.message = message;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Message Delete", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Message delete: " + error.stack
        });
    }
});
DBS.Bot.on("messageUpdate", (oldmessage, newmessage) => {
    let guildVars = {};
    guildVars.guild = newmessage.guild;
    guildVars.newmessage = newmessage;
    guildVars.oldmessage = oldmessage;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Message Update", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Message update: " + error.stack
        });
    }
});
DBS.Bot.on("roleCreate", role => {
    let guildVars = {};
    guildVars.guild = role.guild;
    guildVars.role = role;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Role Create", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Role create: " + error.stack
        });
    }
});
DBS.Bot.on("roleDelete", role => {
    let guildVars = {};
    guildVars.guild = role.guild;
    guildVars.role = role;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Role Delete", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Role delete: " + error.stack
        });
    }
});
DBS.Bot.on("roleUpdate", (oldrole, newrole) => {
    let guildVars = {};
    guildVars.guild = newrole.guild;
    guildVars.oldrole = oldrole;
    guildVars.newrole = newrole;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Role Update", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Role update: " + error.stack
        });
    }
});
DBS.Bot.on("typingStart", (typing) => {
    let guildVars = {};
    guildVars.guild = typing.channel.guild;
    guildVars.channel = typing.channel;
    guildVars.user = typing.user;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Typing Start", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Typing start: " + error.stack
        });
    }
});
DBS.Bot.on("userUpdate", (olduser, newuser) => {
    let guildVars = {};
    guildVars.guild = newuser.guild;
    guildVars.olduser = olduser;
    guildVars.newuser = newuser;
    try {
        DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "User Update", guildVars);
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "User Update: " + error.stack
        });
    }
});
DBS.Bot.on("interactionCreate", async interaction => {
    let guildVars = {};
    guildVars.guild = interaction.guild;
    try {
        if (interaction.isButton()) {
            await interaction.deferReply({ephemeral: DBS.buttons[interaction.customId]["ephemeral"]});
            guildVars.buttoninteraction = interaction;
            DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Button Interaction", guildVars);
        } else if (interaction.isSelectMenu()) {
            console.log(DBS.selects);
            await interaction.deferReply({ephemeral: DBS.selects[interaction.customId]["ephemeral"]});
            guildVars.selectinteraction = interaction;
            DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Select Interaction", guildVars);
        }
        else {
            //interaction.followUp({ content: "hello" });
            await interaction.deferReply({ephemeral: DBS.slashCommands[interaction.commandName]["ephemeral"]});
            guildVars.commandinteraction = interaction;
            DBS.EventHandler.Event_Handle(DBS, DBS.EventsFile, 0, "Command Interaction", guildVars);
        }
    } catch (error) {
        DBS.logError({
            level: "error",
            message: "Interaction Create: " + error.stack
        });
    }
});

DBS.loadVars = async function () {
    DBS.serverVars = {};
    DBS.globalVars = {};
    try {
        var rawserverdata = fs.readFileSync(__dirname + "/BotData/variables/servervars.json");
        var serverdata = flatted.parse(rawserverdata);
    } catch (error) {
        var serverdata = {};
    }

    try {
        var rawglobaldata = fs.readFileSync(__dirname + "/BotData/variables/globalvars.json");
        var globaldata = flatted.parse(rawglobaldata);
    } catch (error) {
        var globaldata = {};
    }

    DBS.serverVars = serverdata;
    DBS.globalVars = globaldata;
};

DBS.loadVars();
DBS.loadBot();

/* If the UI program is closed, kill the bot so the process isn't left hanging */
function cleanExit() {
    try {
        console.log("Killing bot");
        DBS.Bot.destroy();
        process.exit(0);
    } catch (error) {
        console.log(error);
    }
}

//process.on("SIGINT", cleanExit()); // catch ctrl-c
//process.on("SIGTERM", cleanExit());

process.on("message", msg => {
    if (msg.action === "STOP") {
        // Execute Graceful Termination code
        cleanExit();
    }
});

process.on("unhandledRejection", (error, p) => {
    DBS.logError({ level: "error", message: "Unhandled rejection: " + error.stack });
});

DBS.logError = async function (error) {
    logger.log(error);
    process.send(error.message);
    console.log(error.message);
};

function deepSearchItems(object, key, predicate) {
    let ret = [];
    if (object.hasOwnProperty(key) && predicate(key, object[key]) === true) {
        ret = [...ret, object];
    }
    if (Object.keys(object).length) {
        for (let i = 0; i < Object.keys(object).length; i++) {
            let value = object[Object.keys(object)[i]];
            if (typeof value === "object" && value != null) {
                let o = deepSearchItems(object[Object.keys(object)[i]], key, predicate);
                if (o != null && o instanceof Array) {
                    ret = [...ret, ...o];
                }
            }
        }
    }
    return ret;
}
