const Discord = require("discord.js");
const fs = require("fs");
cache = require("../BotData/varcache");
usercache = require("../BotData/usercache");
var userCache = usercache.memoryCache.users;
const Functions = require("../DiscordFunctions");
const Papa = require("papaparse");
const path = require("path");
const flatted = require("flatted");
const { time } = require("console");
const { parse } = require("path");
var breakFailure = true;
vars = {};
var serverVars = {};
var globalVars = {};
var DBS;
var geval = eval;

module.exports.Message_Handle = async function (dbs, msg, command, index, args) {
    DBS = dbs;
    msg.args = args;
    serverVars = dbs.serverVars;
    globalVars = dbs.globalVars;
    var hasPermission = false;
    var action = command.actions[index];
    if (action.type === "Wait") {
        this.Wait_Handle(dbs, msg, command, index, args, action);
    } else {
        await this.RunAction(dbs.Bot, msg, action, dbs);
        dbs.callNextAction(command, msg, args, index + 1);
    }

    fs.writeFileSync(
        path.join(__dirname, "../BotData/variables/servervars.json"),
        flatted.stringify(DBS.serverVars, null, 2),
        function (err) {
            if (err) return console.log(err);
        }
    );
    fs.writeFileSync(
        path.join(__dirname, "../BotData/variables/globalvars.json"),
        flatted.stringify(DBS.globalVars, null, 2),
        function (err) {
            if (err) return console.log(err);
        }
    );
};

module.exports.Wait_Handle = async function (dbs, msg, command, index, args, action) {
    const timer = ms => new Promise(res => setTimeout(res, ms));
    let parsedAction = ParseActionVariables(action, msg);
    let waitTime = parsedAction.waitduration;
    let unit = parsedAction.unit;
    let timeMultiplier;
    switch (unit) {
        case "seconds":
            timeMultiplier = 1;
            break;
        case "minutes":
            timeMultiplier = 60;
            break;
        case "hours":
            timeMultiplier = 3600;
            break;
        case "days":
            timeMultiplier = 86400;
        default:
            imeMultiplier = 1;
            break;
    }
    await timer(waitTime * timeMultiplier * 1000);
    DBS.callNextAction(command, msg, args, index + 1);
};

module.exports.RunAction = async function (client, msg, action) {
    infoLog(action);
    var parsedAction = ParseActionVariables(action, msg);
    infoLog("parsed:");
    infoLog(parsedAction);
    switch (action.type) {
        case "Send Message":
            await this.SendMessage_Handle(msg, client, parsedAction);
            break;
        case "Send Image":
            await this.SendImage_Handle(msg, client, parsedAction);
            break;
        case "Send Embed":
            await this.SendEmbed_Handle(msg, client, parsedAction);
            break;
        case "Add Role to User":
            this.AddRoleToUser_Handle(msg, client, parsedAction);
            break;
        case "Send Random Image":
            this.SendRandomImage_Handle(msg, client, parsedAction);
            break;
        case "Kick User":
            this.KickUser_Handle(msg, client, parsedAction);
            break;
        case "Ban User":
            this.BanUser_Handle(msg, client, parsedAction);
            break;
        case "Role Reaction Menu":
            this.RoleReactionMenu_Handle(msg, client, parsedAction);
            break;
        case "Create Channel":
            await this.CreateChannel_Handle(msg, client, parsedAction);
            break;
        case "Store Value in Variable":
            StoreValeinVariable_Handle(msg, client, action);
            break;
        case "Set Bot Game":
            this.SetBotGame_Handle(msg, client, parsedAction);
            break;
        case "Set Status":
            this.SetStatus_Handle(msg, client, parsedAction);
            break;
        case "Set Avatar":
            this.SetAvatar_Handle(msg, client, parsedAction);
            break;
        case "Delete Channel":
            this.DeleteChannel_Handle(msg, client, parsedAction);
            break;
        case "Delete All Messages":
            this.DeleteAllMessages_Handle(msg, client, parsedAction);
            break;
        case "Get Mentioned User":
            StoreValeinVariable_Handle(msg, client, parsedAction);
            break;
        case "Add Role to Server":
            await this.AddRoletoServer_Handle(msg, client, parsedAction);
            break;
        case "Get Command Author":
            StoreValeinVariable_Handle(msg, client, parsedAction);
            break;
        case "Set User Data":
            this.SetUserData_Handle(msg, client, parsedAction);
            break;
        case "Get User Data":
            StoreValeinVariable_Handle(msg, client, parsedAction);
            break;
        case "Edit User Data":
            EditUserData(msg, client, parsedAction);
            break;
        case "Get Command Channel":
            StoreValeinVariable_Handle(msg, client, parsedAction);
            break;
        case "Check User Data":
            this.CheckUserData(msg, client, parsedAction);
            break;
        case "Get Row":
            await this.GetRow_Handle(msg, client, parsedAction);
            break;
        case "Generate Random Number":
            StoreValeinVariable_Handle(msg, client, parsedAction);
            break;
        case "Edit Variable":
            this.EditVariable_Handle(msg, client, parsedAction);
            break;
        case "Check Variable Value":
            this.CheckVariableValue_Handle(msg, client, parsedAction);
            break;
        case "Check User Permissions":
            this.CheckUserPermissions_Handle(msg, client, parsedAction);
            break;
        case "Remove Role From User":
            this.RemoveRoleFromUser_Handle(msg, client, parsedAction);
            break;
        case "Add Reaction Listener":
            this.CreateReactionCollector(msg, client, parsedAction);
            break;
        case "Set Bot Activity":
            this.SetBotActivity_Handle(msg, client, parsedAction);
            break;
        case "Set Bot Status":
            this.SetBotStatus_Handle(msg, client, parsedAction);
            break;
        case "Check If Variable Exists":
            this.IfVarExists_Handle(msg, client, parsedAction);
            break;
        case "Delete Message":
            this.DeleteMessage_Handle(msg, client, parsedAction);
            break;
        case "Create Category":
            this.CreateCategory_Handle(msg, client, parsedAction);
            break;
        case "Check If Message Is In Channel":
            this.CheckIfMessageIsInChannel_Handle(msg, client, parsedAction);
            break;
        case "Update Channel Permissions":
            this.UpdateChannelPermissions_Handle(msg, client, parsedAction);
            break;
        case "Switch Case":
            this.SwitchCase_Handle(msg, client, parsedAction);
            break;
        case "Check If Array Contains Value":
            this.CheckIfArrayContainsValue_Handle(msg, client, parsedAction);
            break;
        case "Check If User Has Role":
            this.CheckIfUserHasRole_Handle(msg, client, parsedAction);
            break;
        case "Check If String Contains":
            this.CheckIfStringContains_Handle(msg, client, parsedAction);
            break;
        case "Edit Message":
            await this.EditMessage_Handle(msg, client, parsedAction);
            break;
    }
};

module.exports.EditMessage_Handle = async function(msg, client, action) {
    let chan = FindChannel(msg, action);
    console.log(chan);
    let message = await chan.messages.fetch(action.messageid);
    message.edit({ content: action.messagetext });
}

module.exports.GetMentionedUser_Handle = function (msg, client, action) {
    console.log("getting mentioned user");
    console.log(msg.mentions.members.first());
};

module.exports.CheckIfStringContains_Handle = function(msg, client, action) {
    let passActions = {};
    if (action.stringtocheck.includes(action.valuetocheck)) {
        passActions.actions = action.trueActions;
        DBS.callNextAction(passActions, msg, msg.args, 0);
    }
    else {
        passActions.actions = action.falseActions;
        DBS.callNextAction(passActions, msg, msg.args, 0);
    }
}

module.exports.CheckIfUserHasRole_Handle = function (msg, client, action) {
    let role = msg.guild.roles.cache.find(
        role => role.name == action.role || role.id == action.role
    );
    let mem = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );
    let passActions = {};

    if (role && mem.roles.cache.has(role.id)) {
        passActions.actions = action.trueActions;
        DBS.callNextAction(passActions, msg, msg.args, 0);
    }
    else {
        passActions.actions = action.falseActions;
        DBS.callNextAction(passActions, msg, msg.args, 0);
    }
}

module.exports.CheckIfArrayContainsValue_Handle = function (msg, client, action) {
    let passActions = {};
    if (action.varname.includes(action.value)) {
        passActions.actions = action.trueActions;
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    } else {
        passActions.actions = action.falseActions;
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    }
};

String.prototype.toTemplate = function () {
    return eval("`" + this + "`");
};

function ParseActionVariables(action, msg) {
    // Setup DBS vars for this command
    var dbsVars = {};
    dbsVars["CommandAuthor"] = msg.member;
    dbsVars["CommandChannel"] = msg.channel;
    dbsVars["CommandMessage"] = msg;
    dbsVars["DefaultChannel"] = Functions.getDefaultChannel(msg.guild);
    dbsVars["guild"] = msg.guild;

    // Set up object for variable replacement
    var injectVariables = {};
    injectVariables.dbsVars = dbsVars;
    injectVariables.serverVars = serverVars[msg.guild.id];
    injectVariables.tempVars = cache[msg.guild.id].variables;
    injectVariables.globalVars = globalVars;

    var newaction = Object.assign({}, action);
    if (action) {
        if (action.fields) {
            newaction.fields = JSON.parse(JSON.stringify(action.fields));
        } else {
            newaction.fields = [];
        }
    }

    regex = /%%(\w+)\[([\w\s]+)\]%%/g; ///%%(.*?)%%/g;
    var regex1 = /%%(.*?)%%/g;
    var varRegex = /\${(.*?)}/g;
    // Get the array of current variables
    Object.keys(newaction).forEach(e => {
        try {
            if (
                e !== "trueActions" &&
                e !== "falseActions" &&
                e !== "fields" &&
                e !== "permissions" &&
                e !== "reactionActions" &&
                e !== "valueActions" &&
                e !== "authorimageurl" &&
                e !== "messageActionRows"
            ) {
                var newVal = newaction[e];
                newVal = newVal.replace("$$CommandChannel$$", msg.channel.name);
                newVal = newVal.replace("$$CommandAuthor$$", msg.author.id);
                newVal = newVal.replace("$$AuthorDisplayName$$", msg.member.displayName);
                newVal = newVal.replace("$$AuthorAvatar$$", msg.author.avatarURL);
                newVal = newVal.replace(
                    "$$DefaultChannel$$",
                    Functions.getDefaultChannel(msg.guild)
                );
                newVal = newVal
                    .replace("$$ServerIcon$$", msg.guild.iconURL)
                    .replace("$$MemberCount$$", msg.guild.memberCount.toString())
                    .replace("$$JoinedAt$$", msg.guild.joinedAt.toString())
                    .replace("$$ServerName$$", msg.guild.name)
                    .replace("$$ServerOwner$$", msg.guild.ownerId)
                    .replace("$$ServerRegion$$", msg.guild.region)
                    .replace("${dbsVars.CommandAuthor.user.dmChannel}", "@@MSG_AUTHOR@@")
                    .replace("$$VerificationLevel$$", msg.guild.verificationLevel.toString());
                //newVal = eval("`" + newVal + "`");
                //newVal = inject(newVal, injectVariables);
                newaction[e] = newVal;
            } else if (e === "fields") {
                Array.prototype.forEach.call(newaction[e], child => {
                    var newVal = child.value;
                    newVal = newVal.replace("$$CommandChannel$$", msg.channel.name);
                    newVal = newVal.replace("$$CommandAuthor$$", msg.author.id);
                    newVal = newVal.replace("$$AuthorDisplayName$$", msg.member.displayName);
                    newVal = newVal.replace("$$AuthorAvatar$$", msg.author.avatarURL);
                    newVal = newVal.replace(
                        "$$DefaultChannel$$",
                        Functions.getDefaultChannel(msg.guild)
                    );
                    newVal = newVal
                        .replace("$$ServerIcon$$", msg.guild.iconURL)
                        .replace("$$MemberCount$$", msg.guild.memberCount.toString())
                        .replace("$$JoinedAt$$", msg.guild.joinedAt.toString())
                        .replace("$$ServerName$$", msg.guild.name)
                        .replace("$$ServerOwner$$", msg.guild.ownerId)
                        .replace("$$ServerRegion$$", msg.guild.region)
                        .replace("${dbsVars.CommandAuthor.user.dmChannel}", "@@MSG_AUTHOR@@")
                        .replace("$$VerificationLevel$$", msg.guild.verificationLevel.toString());
                    //newVal = eval("`" + newVal + "`");
                    child.value = newVal;
                });
            } else if (e == "authorimageurl") {
                var newVal = newaction[e];
                let aurl = msg.member.user.displayAvatarURL();
                newVal = newVal.replace("${dbsVars.CommandAuthor.user.avatarURL}", aurl);
                newaction[e] = newVal;
            }
        } catch (err) {
            DBS.logError({ level: "error", message: err.stack });
        }
        //console.log(`key=${e}  value=${action[e]}`)
    });

    //if (cache[msg.guild.id]) {
    Object.keys(newaction).forEach(e => {
        try {
            if (
                e !== "trueActions" &&
                e !== "falseActions" &&
                e !== "fields" &&
                e !== "permissions" &&
                e !== "reactionActions" &&
                e !== "valueActions" &&
                e !== "messageActionRows"
            ) {
                var newVal = newaction[e].replace(regex1, function (m) {
                    var match = m.slice(2, m.toString().length - 2);
                    return getDescendantProp(injectVariables, "tempVars." + match);
                });
                newVal = newVal.replace(varRegex, function (m) {
                    var match = m.slice(2, m.toString().length - 1);
                    return getDescendantProp(injectVariables, match);
                });
                newaction[e] = newVal;
            } else if (e === "fields") {
                Array.prototype.forEach.call(newaction[e], child => {
                    var newValF = child.value.replace(regex1, function (m) {
                        var match = m.slice(2, m.toString().length - 2);
                        return getDescendantProp(injectVariables, "tempVars." + match);
                    });
                    newValF = newValF.replace(varRegex, function (m) {
                        var match = m.slice(2, m.toString().length - 1);
                        return getDescendantProp(injectVariables, match);
                    });
                    child.value = newValF;
                });
            } else if (e === "reactionActions") {
                console.log("reaction actions");
                Object.keys(newaction[e]).forEach(child => {
                    let newKey = child.replace(regex1, function (m) {
                        var match = m.slice(2, m.toString().length - 2);
                        return getDescendantProp(injectVariables, "tempVars." + match);
                    });
                    if (newKey) {
                        newaction[e][newKey] = newaction[e][child];
                        delete newaction[child];
                    }
                    newKey = null;
                    newKey = child.replace(varRegex, function (m) {
                        var match = m.slice(2, m.toString().length - 1);
                        return getDescendantProp(injectVariables, match);
                    });
                    if (newKey) {
                        newaction[e][newKey] = newaction[e][child];
                        delete newaction[child];
                    }
                });
            }
        } catch (err) {
            DBS.logError({ level: "error", message: err.stack });
        }
    });
    //}
    return newaction;
}

function saveTypeDef(guild, type, value, key) {
    if (guild && type && value && key) {
        if (!serverVars[guild.id]) serverVars[guild.id] = {};
        if (!cache[guild.id]) cache[guild.id] = {};
        if (!cache[guild.id].variables) cache[guild.id].variables = {};

        var variableObject;
        if (type === "server") {
            variableObject = serverVars[guild.id];
        } else if (type === "global") {
            variableObject = globalVars;
        } else {
            variableObject = cache[guild.id].variables;
        }
        variableObject[key] = value;

        console.log("Server: ");
        console.log(serverVars);
        console.log("Global: ");
        console.log(globalVars);
        console.log("Temp: ");
        console.log(cache);
    }
}

module.exports.SendMessage_Handle = async function (msg, client, action) {
    let RowComponents = BuildRowComponents(action);
    if (action.channelname === "@@MSG_AUTHOR@@") {
        var sent = await msg.author.send({
            content: action.messagetext,
            components: RowComponents
        });
        saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
    } else {
        const chan = FindChannel(msg, action);
        // Validate channel name
        if (chan) {
            var sent = await chan.send({ content: action.messagetext, components: RowComponents });
            saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
        } else if (action.channelname == "" && msg != "") {
            var sent = await msg.reply({ content: action.messagetext, components: RowComponents });
            saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
        }
    }
};

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

module.exports.SendImage_Handle = async function (msg, client, action) {
    let RowComponents = BuildRowComponents(action);
    let guild = msg.guild;
    if (action.channelname === "@@MSG_AUTHOR@@") {
        var sent = await msg.author.send({ content: action.url, components: RowComponents });
        saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
    } else {
        const chan = FindChannel(msg, action);
        // Validate channel name
        if (chan) {
            var sent = await chan.send({ files: [action.url], components: RowComponents });
            saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
        } else if (action.channelname == "" && msg != "") {
            var sent = await msg.channel.send({ content: action.url, components: RowComponents });
            saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
        }
    }
};

module.exports.SendEmbed_Handle = async function (msg, client, action) {
    let RowComponents = BuildRowComponents(action);
    const Embed = new Discord.MessageEmbed()
        .setColor(action.color)
        .setTitle(action.title)
        .setURL(action.url)
        .setAuthor(action.authorname, action.authorimageurl, action.authorlink)
        .setDescription(action.description)
        .setThumbnail(action.thumbnail)
        .setImage(action.image)
        .setFooter(action.footer);
    if (action.timestamp == "BOOL_TRUE@@") {
        Embed.setTimestamp();
    }

    if (action.fields) {
        action.fields.forEach(field => {
            var inlineTrue = field.inline == "true";
            if (field.name !== "" && field.value !== "")
                Embed.addField(field.name, field.value, inlineTrue);
        });
    }

    if (action.channelname === "@@MSG_AUTHOR@@") {
        var sent = await msg.author.send({ embeds: [Embed], components: RowComponents });
        saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
    } else {
        const chan = FindChannel(msg, action);
        // Validate channel name
        if (chan) {
            var sent = await chan.send({ embeds: [Embed], components: RowComponents });
            saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
        } else if (action.channelname == "" && msg != "") {
            var sent = await msg.channel.send({ embeds: [Embed], components: RowComponents });
            saveTypeDef(msg.guild, action.savetovariabletype, sent, action.savetovariable);
        }
    }
};

module.exports.AddRoleToUser_Handle = function (msg, client, action) {
    var bot;
    var roleImport = [];
    msg.guild.members.cache.forEach(mem => {
        if (mem.user.tag == client.user.tag) {
            bot = mem;
        }
    });
    bot.roles.cache.forEach(element => {
        roleImport.push(element.position);
    });

    //var usertag = msg.content.split(" ")[1];
    var botRole = Math.max.apply(Math, roleImport);

    //Make sure user who sent command has high enough role
    var rolel = msg.guild.roles.cache.find(
        role => role.name == action.rolename || role.id == action.rolename
    );
    if (rolel.position >= botRole) {
        console.log("ERROR: The bot must have a role higher than the one it is assigning");
    } else {
        if (!rolel) {
            console.log("ERROR: The Role: " + action.rolename + " does not exist");
        } else {
            if (action.user === "" || action.user == "undefined") {
                msg.member.roles.add(rolel);
            } else {
                let mem = msg.guild.members.cache.find(
                    gm => gm.user.tag == action.user || gm.user.id == action.user
                );

                if (mem) {
                    mem.roles.add(rolel);
                } else {
                    console.log("ERROR: Could not find user with tag: " + action.user);
                }
            }
        }
    }
};

module.exports.RemoveRoleFromUser_Handle = function (msg, client, action) {
    let removeUser = GetUserByTagOrId(msg.guild, action.user);
    let role = msg.guild.roles.cache.find(
        role => role.name == action.rolename || role.id == action.rolename
    );
    if (removeUser && role) {
        removeUser.roles.remove(role, action.reason).catch(console.error);
    }
};

module.exports.SendRandomImage_Handle = function (msg, client, action) {
    var count = action.urls.length;
    var rand = Math.floor(Math.random() * count);
    var channel = action.channelname;
    var chan = msg.guild.channels.find(ch => ch.name === channel);
    if (!chan && channel != "") {
        console.log("ERROR: No channel found with name: " + channel);
    } else if (channel == "" && msg != "") {
        msg.channel.send({ files: [action.urls[rand]] });
    } else {
        chan.send({ files: [action.urls[rand]] });
    }
};

module.exports.KickUser_Handle = function (msg, client, action) {
    var member = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );

    // Get the reason string
    var reason = action.reason;

    if (member) {
        member
            .kick(reason)
            .then(member => {
                console.log("Kicked member");
            })
            .catch(e => {
                console.log(e);
            });
    } else {
        console.log("ERROR: Member to be kicked not found");
    }
};

module.exports.BanUser_Handle = function (msg, client, action) {
    var member = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );

    var options = {};
    options.reason = action.reason;
    action.days ? (options.days = action.days) : (options.days = 0);

    if (member) {
        member
            .ban(options)
            .then(member => {
                console.log("Banned member");
            })
            .catch(e => {
                console.log(e);
            });
    } else {
        console.log("ERROR: Member to be banned not found");
    }
};

module.exports.RoleReactionMenu_Handle = function (msg, client, action) {
    const Embed = new Discord.RichEmbed()
        .setColor(action.color)
        .setTitle(action.title)
        .setDescription(action.description);

    action.roles.forEach(role => {
        const emo = client.emojis.find(emoji => emoji.name === role.emoji);
        if (emo) {
            Embed.addField(role.role, `${emo}`);
        } else {
            Embed.addField(role.role, role.emoji);
        }
    });

    const chan = FindChannel(msg, action);
    // Validate channel
    if (!chan && action.channelname != "") {
        console.log(
            "ERROR: No channel found with name: " +
                action.channelname +
                ". Action name: " +
                action.name
        );
    } else if (action.channelname == "" && msg != "") {
        msg.channel.send(Embed).then(embedmsg => {
            action.roles.forEach(role => {
                embedmsg.react(getEmoji(client, role.emoji));
            });
            setCollector(embedmsg, action);
        });
    } else {
        chan.send(Embed).then(embedmsg => {
            action.roles.forEach(role => {
                embedmsg.react(getEmoji(client, role.emoji));
            });
            setCollector(embedmsg, action);
        });
    }
};

function setCollector(msg, action) {
    const filter = (reaction, user) => {
        return user.id !== msg.author.id;
    };
    const collector = msg.createReactionCollector(filter, {
        time: action.duration * 1000
    });

    collector.on("collect", (reaction, reactionCollector) => {
        var role = action.roles.find(rl => rl.emoji == reaction.emoji.name);
        if (role) {
            reaction.users.cache.forEach(user => {
                if (!user.bot) {
                    var ReactedMember = msg.guild.members.find(mem => mem.user.id == user.id);
                    var RoleToGive = msg.guild.roles.find(rl => rl.name == role.role);
                    console.log(ReactedMember + " " + RoleToGive.name);
                    if (ReactedMember && RoleToGive) {
                        ReactedMember.addRole(RoleToGive);
                    } else {
                        console.log("ERROR: Could not find role or member to give");
                    }
                }
            });
        } else {
            console.log("ERROR: Role not found for this reaction");
        }
    });

    collector.on("end", collected => {
        console.log(`Collected ${collected.size} items`);
    });
}

function StoreValeinVariable_Handle(msg, client, action) {
    var variableObject = {};
    var paramValue;
    var guild = msg.guild;
    console.log("storing value in variable");
    console.log(globalVars);
    // Save variable to temp/server/global vars.
    if (!action.savevartype) action.savevartype = "temp";
    if (action.savevartype) {
        if (!serverVars[guild.id]) serverVars[guild.id] = {};
        if (!cache[guild.id]) cache[guild.id] = {};
        if (!cache[guild.id].variables) cache[guild.id].variables = {};

        var variableObject;
        if (action.savevartype === "server") {
            variableObject = serverVars[guild.id];
        } else if (action.savevartype === "global") {
            variableObject = globalVars;
        } else {
            variableObject = cache[guild.id].variables;
        }
        console.log(variableObject);
        // Save based on the node type
        if (action.type === "Get Command Author") {
            let found = msg.author;
            paramValue = found.id;
        } else if (action.type === "Get User Data") {
            let mem = msg.guild.members.cache.find(
                gm => gm.user.tag == action.user || gm.user.id == action.user
            );
            if (userCache[mem.id]) {
                paramValue = userCache[mem.id][action.field];
            }
        } else if (action.type === "Generate Random Number") {
            if (!isNaN(Number(action.min)) && !isNaN(Number(action.max))) {
                paramValue = Math.floor(
                    Math.random() * (Number(action.max) - Number(action.min) + 1) +
                        Number(action.min)
                ).toString();
                action.vartype = "Number";
            }
        } else if (action.type === "Get Command Channel") {
            paramValue = msg.channel.name;
        } else if (action.vartype == "User") {
            let found = msg.mentions.members.first();
            paramValue = found;
            // Store value in variable node
        } else if (action.param == 0) {
            paramValue = msg.content.substr(msg.content.indexOf(" ") + 1);
        } else if (action.param.includes("+")) {
            let startIndex = action.param.substr(msg.content.indexOf("+") - 1, 1);
            console.log("startIndex: " + startIndex);
            let a = msg.content.split(" ");
            paramValue = a.slice(startIndex).join(" ");
        } else {
            paramValue = msg.content.split(" ")[action.param];
        }
        // If numeric then convert
        if (action.vartype == "number") {
            try {
                paramValue = Number(paramValue);
            } catch (err) {
                DBS.logError({
                    level: "error",
                    message: "ERROR converting value: " + paramValue + " to number"
                });
            }
        }
        variableObject[action.varname] = paramValue;
        console.log(variableObject);
    }
}

module.exports.CreateChannel_Handle = async function (msg, client, action) {
    var server = msg.guild;
    let chan;
    let channeltype = action.channeltype.toLowerCase() === "text" ? "GUILD_TEXT" : "GUILD_VOICE";
    if (action.chancategory) {
        chan = await server.channels.create(action.channelname, {
            type: channeltype,
            reason: action.reason,
            parent: server.channels.cache.find(
                ct =>
                    ct.name.toLowerCase() === action.chancategory.toLowerCase() ||
                    ct.id === action.chancategory
            )
        });
    } else {
        chan = await server.channels.create(action.channelname, {
            type: channeltype,
            reason: action.reason
        });
    }
    saveTypeDef(msg.guild, action.savetovariabletype, chan, action.savetovariable);
};

module.exports.DeleteChannel_Handle = function (msg, client, action) {
    var fetchedChannel = FindChannel(msg, action);
    if (fetchedChannel) {
        fetchedChannel.delete();
    }
};

module.exports.SetBotGame_Handle = function (msg, client, action) {
    client.user.setGame(action.game);
};

module.exports.SetStatus_Handle = function (msg, client, action) {
    client.user.setStatus(action.presencestatus.toLowerCase());
};

module.exports.SetAvatar_Handle = function (msg, client, action) {
    client.user.setAvatar(action.avatar);
};

module.exports.SwitchCase_Handle = function (msg, client, action) {
    for (key of Object.keys(action.valueActions)) {
        if (action.varname == key) {
            let passActions = {};
            passActions.actions = action.valueActions[key];
            DBS.callNextAction(passActions, msg, msg.args, 0);
            break;
        }
    }
};

module.exports.UpdateChannelPermissions_Handle = async function (msg, client, action) {
    let chan = FindChannel(msg, action);
    if (chan) {
        let permissions = {};
        let allow = action.allow === "Allow" ? true : false;
        if (action.permissions) {
            action.permissions.forEach(perm => {
                permissions[perm] = allow;
            });
            chan.permissionOverwrites.edit(action.permid, permissions);
        }
    }
};

module.exports.AddRoletoServer_Handle = async function (msg, client, action) {
    let roleData = {};
    roleData.name = action.rolename;
    roleData.color = action.color;
    if (action.hoist == "BOOL_TRUE@@") roleData.hoist = true;
    if (action.mentionable == "BOOL_TRUE@@") roleData.mentionable = true;
    roleData.position = action.position;
    var role = await msg.guild.roles.create(roleData);
    saveTypeDef(msg.guild, action.savetovariabletype, role, action.savetovariable);
};

module.exports.DeleteAllMessages_Handle = async function (msg, client, action) {
    const chan = FindChannel(msg, action);
    // Validate channel
    if (chan) {
        await chan
            .bulkDelete(action.msgcount)
            .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
            .catch(console.error);
    }
};

module.exports.SetUserData_Handle = function (msg, client, action) {
    let mem = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );
    if (!userCache[mem.id]) {
        userCache[mem.id] = {};
    }
    let valToSet = null;
    if (!isNaN(action.fieldvalue)) {
        valToSet = Number(action.fieldvalue);
    } else {
        valToSet = action.fieldvalue;
    }
    userCache[mem.id][action.field] = valToSet;
};

module.exports.GetUserData_Handle = function (msg, client, action) {
    let mem = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );
    if (userCache[mem.id]) {
    }
};

module.exports.CheckUserData = function (msg, client, action) {
    let mem = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );
    var trueOrFalse = null;
    var valToCheck;
    if (userCache[mem.id]) {
        if (userCache[mem.id][action.field] !== null) {
            if (action.compare === "greater than") {
                if (!isNaN(action.value)) {
                    valToCheck = parseInt(action.value);
                    let currentVal = parseInt(userCache[mem.id][action.field]);
                    if (currentVal > valToCheck) {
                        trueOrFalse = true;
                    } else {
                        trueOrFalse = false;
                    }
                }
            }
            if (action.compare === "less than") {
                if (!isNaN(action.value)) {
                    valToCheck = parseInt(action.value);
                    let currentVal = parseInt(userCache[mem.id][action.field]);
                    if (currentVal < valToCheck) {
                        trueOrFalse = true;
                    } else {
                        trueOrFalse = false;
                    }
                }
            }
            if (action.compare === "equal to") {
                valToCheck = action.value;
                let currentVal = userCache[mem.id][action.field];
                if (currentVal == valToCheck) {
                    trueOrFalse = true;
                } else {
                    trueOrFalse = false;
                }
            }
            var passActions = {};

            if (trueOrFalse === true) {
                passActions.actions = action.trueActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
                //passActions.actions = action.trueActions
            } else {
                passActions.actions = action.falseActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
            }
        }
    } else {
        var passActions = {};
        passActions.actions = action.falseActions;
        DBS.callNextAction(passActions, msg, msg.args, 0);
    }
};

function EditUserData(msg, client, action) {
    let mem = msg.guild.members.cache.find(
        gm => gm.user.tag == action.user || gm.user.id == action.user
    );

    if (!userCache[mem.id]) {
        userCache[mem.id] = {};
        userCache[mem.id][action.field] = 0;
    }
    if (!userCache[mem.id][action.field]) {
        userCache[mem.id][action.field] = 0;
    }
    //console.log(action);
    if (userCache[mem.id]) {
        if (userCache[mem.id][action.field] !== null) {
            let valToSet = null;
            if (!isNaN(action.value)) {
                valToSet = parseInt(action.value);
                let currentval = parseInt(userCache[mem.id][action.field]);
                if (action.oper === "+") {
                    userCache[mem.id][action.field] = currentval + valToSet;
                } else if (action.oper === "-") {
                    userCache[mem.id][action.field] -= valToSet;
                } else if (action.oper === "x") {
                    userCache[mem.id][action.field] *= valToSet;
                } else if (action.oper === "/") {
                    userCache[mem.id][action.field] /= valToSet;
                }
            }
        } else {
            console.log("field doesnt exist");
        }
    }
}

module.exports.GetRow_Handle = async function (msg, client, action) {
    var guild = msg.guild;
    var parentContext = this;
    var passActions = {};
    var objectToAdd = {};
    const csvFile = fs.readFileSync(
        path.resolve(__dirname, "../BotData/sheets/" + action.selectedsheet)
    );
    const csvData = csvFile.toString();
    Papa.parse(csvData, {
        header: true,
        complete: function (results, file) {
            //console.log(results.data);
            var foundValue = results.data.filter(obj => obj[action.colheader] === action.colval);
            if (foundValue.length > 0) {
                if (!action.savevartype) action.savevartype = "temp";
                var variableObject;
                if (action.savevartype === "server") {
                    variableObject = serverVars[guild.id];
                } else if (action.savevartype === "global") {
                    variableObject = globalVars;
                } else {
                    variableObject = cache[guild.id].variables;
                }

                variableObject[action.rowvariable] = foundValue[0];
                console.log(variableObject);

                passActions.actions = action.trueActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
            } else {
                //breakFailure = false;
                passActions.actions = action.falseActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
            }
        }
    });
};

module.exports.EditVariable_Handle = function (msg, client, action) {
    var guild = msg.guild;
    if (!isNaN(Number(action.value))) {
        if (!action.savevartype) action.savevartype = "temp";
        if (action.savevartype) {
            if (!serverVars[guild.id]) serverVars[guild.id] = {};
            if (!cache[guild.id]) cache[guild.id] = {};
            if (!cache[guild.id].variables) cache[guild.id].variables = {};

            var variableObject;
            if (action.savevartype === "server") {
                variableObject = serverVars[guild.id];
            } else if (action.savevartype === "global") {
                variableObject = globalVars;
            } else {
                variableObject = cache[guild.id].variables;
            }

            // Check if numeric
            var existingvar = variableObject[action.varname];
            if (existingvar) {
                if (!isNaN(Number(existingvar))) {
                    var returnValue = 0;
                    var existingValue = Number(existingvar);
                    var numberToEdit = Number(action.value);
                    if (action.oper == "+") {
                        returnValue = existingValue + numberToEdit;
                    } else if (action.oper == "-") {
                        returnValue = existingValue - numberToEdit;
                    } else if (action.oper == "x") {
                        returnValue = existingValue * numberToEdit;
                    } else {
                        returnValue = existingValue / numberToEdit;
                    }

                    variableObject[action.varname] = returnValue;
                }
            }
        }
    }
};

module.exports.CheckVariableValue_Handle = function (msg, client, action) {
    var trueOrFalse = null;
    var guild = msg.guild;

    if (!action.savevartype) action.savevartype = "temp";
    if (action.savevartype) {
        if (!serverVars[guild.id]) serverVars[guild.id] = {};
        if (!cache[guild.id]) cache[guild.id] = {};
        if (!cache[guild.id].variables) cache[guild.id].variables = {};

        var variableObject;
        if (action.savevartype === "server") {
            variableObject = serverVars[guild.id];
        } else if (action.savevartype === "global") {
            variableObject = globalVars;
        } else {
            variableObject = cache[guild.id].variables;
        }

        var existingvar = variableObject[action.varname];
        if (existingvar) {
            if (action.compare === "greater than") {
                if (!isNaN(action.value)) {
                    valToCheck = parseInt(action.value);
                    let currentVal = existingvar;
                    if (currentVal > valToCheck) {
                        trueOrFalse = true;
                    } else {
                        trueOrFalse = false;
                    }
                }
            }
            if (action.compare === "less than") {
                if (!isNaN(action.value)) {
                    valToCheck = parseInt(action.value);
                    let currentVal = existingvar;
                    if (currentVal < valToCheck) {
                        trueOrFalse = true;
                    } else {
                        trueOrFalse = false;
                    }
                }
            }
            if (action.compare === "equal to") {
                valToCheck = action.value;
                let currentVal = existingvar;
                if (currentVal == valToCheck) {
                    trueOrFalse = true;
                } else {
                    trueOrFalse = false;
                }
            }
            var passActions = {};

            if (trueOrFalse === true) {
                passActions.actions = action.trueActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
            } else {
                passActions.actions = action.falseActions;
                DBS.callNextAction(passActions, msg, msg.args, 0);
            }
        }
    }
};

module.exports.CheckUserPermissions_Handle = function (msg, client, action) {
    var mem = GetUserByTagOrId(msg.guild, action.user);
    var hasPerms;
    if (mem) {
        var passActions = {};
        if (action.permissions.length === 0) {
            hasPerms = true;
        } else {
            for (const perm of action.permissions) {
                if (mem.permissions.has(Discord.Permissions.FLAGS[perm])) {
                    hasPerms = true;
                } else {
                    hasPerms = false;
                    break;
                }
            }
        }
        if (hasPerms) {
            passActions.actions = action.trueActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        } else {
            passActions.actions = action.falseActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        }
    } else {
        console.log("Member not found with tag/id: " + action.user);
    }
};

module.exports.SetBotActivity_Handle = async function (msg, client, action) {
    let presenceData = {};
    if (action.streamurl) presenceData.url = action.streamurl;
    presenceData.name = action.activityname;
    presenceData.type = action.activitytype;
    client.user.setPresence({ activities: [presenceData] });
};

module.exports.SetBotStatus_Handle = async function (msg, client, action) {
    client.user.setStatus(action.presencestatus);
};

module.exports.CreateReactionCollector = async function (msg, client, action) {
    var guild = msg.guild;
    // Find the message by ID
    msg.guild.channels.cache.some(channel => {
        if (channel.type === "GUILD_TEXT") {
            let message = channel.messages.cache.find(msg => msg.id === action.message);

            if (message) {
                console.log("MESSAGE::::");
                console.log(message);
                var passActions = {};

                if (action.react === "BOOL_TRUE@@") {
                    for (key of Object.keys(action.reactionActions)) {
                        message.react(key);
                    }
                }

                // Setup reaction collector
                const filter = (reaction, user) => {
                    return (
                        Object.keys(action.reactionActions).includes(reaction.emoji.name) &&
                        user.id !== client.user.id
                    );
                };
                //if (action.duration === "0") console.log("listen forever");
                const collector = message.createReactionCollector({
                    filter,
                    time: action.duration * 1000
                });

                console.log(collector);

                collector.on("collect", reaction => {
                    console.log("collected");
                    console.log(
                        `Collected ${reaction.emoji.name} from ${reaction.users.cache.last().tag}`
                    );
                    let member = reaction.message.guild.members.cache.get(
                        reaction.users.cache.last().id
                    );
                    if (!cache[guild.id]) cache[guild.id] = {};
                    if (!cache[guild.id].variables) cache[guild.id].variables = {};
                    // set emoji and user variables
                    if (action.reactionemoji) {
                        cache[guild.id].variables[action.reactionemoji] = reaction.emoji.name;
                    }
                    if (action.reactionuser) {
                        cache[guild.id].variables[action.reactionuser] = member;
                    }

                    passActions.actions = action.reactionActions[reaction.emoji.name];
                    DBS.callNextAction(passActions, msg, msg.args, 0);
                });

                collector.on("end", collected => {
                    console.log(`Collected ${collected.size} items`);
                });
            }
        }
    });
};

module.exports.IfVarExists_Handle = async function (msg, client, action) {
    console.log("checking");
    var guild = msg.guild;

    if (!action.savevartype) action.savevartype = "temp";
    if (action.savevartype) {
        if (!serverVars[guild.id]) serverVars[guild.id] = {};
        if (!cache[guild.id]) cache[guild.id] = {};
        if (!cache[guild.id].variables) cache[guild.id].variables = {};

        var variableObject;
        if (action.savevartype === "server") {
            variableObject = serverVars[guild.id];
        } else if (action.savevartype === "global") {
            variableObject = globalVars;
        } else {
            variableObject = cache[guild.id].variables;
        }

        var existingvar = variableObject[action.varname];
        var passActions = {};
        if (existingvar) {
            passActions.actions = action.trueActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        } else {
            passActions.actions = action.falseActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        }
    }
};

module.exports.DeleteMessage_Handle = async function (msg, client, action) {
    let chan = FindChannel(msg, action);
    console.log(chan);
    client.channels.cache
        .get(chan.id)
        .messages.fetch(action.varname)
        .then(message => message.delete());
};

module.exports.CreateCategory_Handle = async function (msg, client, action) {
    let server = msg.guild;
    let chan = await server.channels.create(action.categoryname, {
        type: "category"
    });
};

module.exports.CheckIfMessageIsInChannel_Handle = async function (msg, client, action) {
    let chan = FindChannel(msg, action);
    if (chan) {
        let trueOrFalse = chan.id == action.messageid;
        let passActions = {};

        if (trueOrFalse === true) {
            passActions.actions = action.trueActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        } else {
            passActions.actions = action.falseActions;
            DBS.callNextAction(passActions, msg, msg.args, 0);
        }
    }
};

function GetUserByTagOrId(guild, tagorid) {
    // User vars stored in <@123456> format should be replaced with just the id
    if (tagorid.startsWith("<@")) {
        tagorid = tagorid.replace("<", "").replace(">", "").replace("@", "");
    }
    var mem = guild.members.cache.find(gm => gm.user.tag == tagorid || gm.user.id == tagorid);
    return mem;
}

function getEmoji(client, emojifield) {
    const emo = client.emojis.find(emoji => emoji.name === emojifield);
    if (emo) {
        return `${emo.id}`;
    } else {
        return emojifield;
    }
}

function FindChannel(msg, action) {
    const chan = msg.guild.channels.cache.find(
        ch =>
            ch.name === action.channelname.toLowerCase() ||
            ch.id === action.channelname.toLowerCase()
    );
    // Validate channel name
    if (!chan && action.channelname != "") {
        console.log(
            "ERROR: No channel found with name: " +
                action.channelname +
                ". Action name: " +
                action.name
        );
        return null;
    } else {
        return chan;
    }
}

function BuildRowComponents(action) {
    let rowComponents = [];
    let returnRows = [];
    //console.log(action.messageActionRows);
    if (action.messageActionRows) {
        action.messageActionRows.forEach(row => {
            if (row.rowtype === "select" && row.customid && row.selectoptions.length > 0) {
                let menu = new Discord.MessageSelectMenu();
                menu.setCustomId(row.customid);
                if (row.placeholdertext) menu.setPlaceholder(row.placeholdertext);
                if (row.minValue) menu.setMinValues(parseInt(row.minValue));
                if (row.maxValue) menu.setMaxValues(parseInt(row.maxValue));
                if (row.selectoptions) {
                    let options = [];
                    row.selectoptions.forEach(option => {
                        let newoption = {};
                        newoption.label = option.label;
                        newoption.value = option.value;
                        if (option.description) newoption.description = option.description;
                        if (option.emoji) newoption.emoji = option.emoji;
                        if (option.defaultoption) newoption.default = true;
                        options.push(newoption);
                    });
                    menu.addOptions(options);
                }
                returnRows.push(new Discord.MessageActionRow().addComponents(menu));
            } else if (row.rowtype === "button" && row.buttons) {
                if (row.buttons.length > 0) {
                    let buttons = [];
                    row.buttons.forEach(button => {
                        let newbutton = new Discord.MessageButton();
                        if (button.label) newbutton.setLabel(button.label);
                        // Link buttons cannot have customid and dont fire an event
                        if (button.customid && button.style !== "LINK")
                            newbutton.setCustomId(button.customid);
                        if (button.style) newbutton.setStyle(button.style);
                        if (button.emoji) newbutton.setEmoji(button.emoji);
                        if (button.style === "LINK" && button.URL) newbutton.setURL(button.URL);
                        buttons.push(newbutton);
                    });
                    returnRows.push(new Discord.MessageActionRow().addComponents(buttons));
                }
            }
        });
    }
    return returnRows;
}

function contains(arr, key, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) return true;
    }
    return false;
}

let inject = (str, obj) => str.replace(/\${(.*?)}/g, (x, g) => obj[g]);

function getDescendantProp(obj, desc) {
    var arr = desc.split(".");

    while (arr.length) {
        if (arr[0] == "avatarURL") {
            console.log(arr);
            console.log(obj);
            return obj.displayAvatarURL();
        }
        if (arr[0] == "iconURL") {
            console.log(arr);
            console.log(obj);
            return obj.iconURL();
        }
        if (arr[0] == "dmChannel") {
            return obj.id;
        }
        obj = obj[arr.shift()];
    }
    return obj;
}

// Console log color defs
var FgYellow = "\x1b[33m\x1b[0m";
function infoLog(str) {
    console.log("\x1b[33m", str, "\x1b[0m");
}
