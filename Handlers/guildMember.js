const Discord = require("discord.js");
var MsgHandler = require('./Message');

module.exports.guildMemberAdd_Handle = function(client, member, events) {
    events.command.forEach(command => {
        if (command.type == 'User joins server') {
            command.actions.forEach(action => {
                switch(action.type) {
                    case "Send Message":
                        SendMessage_Handle(member, client, action);
                        break;
                    case "Send Image":
                        MsgHandler.SendImage_Handle('', client, action);
                        break;
                    case "Send Embed":
                        MsgHandler.SendEmbed_Handle('', client, action);
                        break;
                    case "Send Random Image":
                        MsgHandler.SendRandomImage_Handle('', client, action);
                        break;
                    case "Give User Role":
                        GiveUserRole_Handle(member, client, action);
                        break;
                    case "DM User":
                        DMUser_Handle(member, client, action);
                        break;
                }
            });
        }
    });
}

function SendMessage_Handle(member, client, action) {
    const chan = client.channels.find(ch => ch.name === action.channelname);
    // Validate channel name
    if (!chan) {
        console.log('ERROR: No channel found with name: ' + action.channelname + '. Action name: ' + action.name)
    } 
    else {
        chan.send(eval("`" + action.messagetext + "`"));
    }
}

function GiveUserRole_Handle(member, client, action) {
    var role = member.guild.roles.find(role => role.name == action.role);

    if (role) {
        member.addRole(role);
    }
    else {
        console.log('ERROR: No role found with name: ' + action.role);
    }
}

function DMUser_Handle(member, client, action) {
    member.send(eval('`' + action.message + '`'));
}
