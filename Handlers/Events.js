const Discord = require("discord.js");
const MsgHandler = require("./Message");
cache = require("../BotData/varcache");
usercache = require("../BotData/usercache");
var usersFile = __dirname + "/../BotData/user/user.json";
var userCache = usercache.memoryCache.users;
const Functions = require("../DiscordFunctions");
var guild;
var breakFailure = true;
const fs = require("fs");
const Papa = require("papaparse");
const path = require("path");
vars = {};
var DBS;
var varsEToPass;
var serverVars = {};
var globalVars = {};

module.exports.Event_Handle = async function (dbs, events, index, type, varsE, aEvent) {
  var client = dbs.Bot;
  DBS = dbs;
  var applicableEvent;
  guild = varsE.guild;
  varsEToPass = varsE;
  //console.log("handling event :" + type);
  //console.log(varsE.guild.name);
  serverVars = dbs.serverVars;
  globalVars = dbs.globalVars;

  if (!aEvent) {
    applicableEvent = events.command.find((e) => e.name == type);
    if (varsE) {
      if (!cache[guild.id]) cache[guild.id] = {};
      let cVars = cache[guild.id];
      if (!cVars.variables) cVars.variables = [];
      let vararray = cVars.variables;

      if (applicableEvent) {
        // Set the temp variables based on the event
        switch (type) {
          case "Channel Create":
            vararray["createdchannel"] = varsE.channel;
            break;
          case "Channel Delete":
            vararray["deletedchannel"] = varsE.channel;
            break;
          case "Channel Pins Update":
            vararray["updatedpinschannel"] = varsE.channel;
            break;
          case "Channel Update":
            vararray["updatedchannelnew"] = varsE.newchannel;
            vararray["updatedchannelold"] = varsE.oldchannel;
            break;
          case "Emoji Create":
            vararray["createdemoji"] = varsE.emoji;
            break;
          case "Emoji Delete":
            vararray["deletedemoji"] = varsE.emoji;
            break;
          case "Emoji Update":
            vararray["updatedemojinew"] = varsE.newemoji;
            vararray["updatedemojiold"] = varsE.oldemoji;
            break;
          case "Guild Ban Remove":
            vararray["banremoveduser"] = varsE.user;
            break;
          case "Guild Create":
            vararray["createdguild"] = varsE.guild;
            break;
          case "Guild Delete":
            vararray["deletedguild"] = varsE.guild;
            break;
          case "Guild Member Available":
            vararray["availableguildmember"] = varsE.member;
            break;
          case "Guild Member Speaking":
            vararray["speakingmember"] = varsE.member;
            break;
          case "Guild Member Update":
            vararray["updatedmemberold"] = varsE.oldmember;
            vararray["updatedmembernew"] = varsE.newmember;
            break;
          case "Guild Unavailable":
            vararray["unavailableguild"] = varsE.guild;
            break;
          case "Guild Update":
            vararray["updatedguildnew"] = varsE.newguild;
            vararray["updatedguildold"] = varsE.oldguild;
            break;
          case "Message Delete":
            vararray["deletedmessage"] = varsE.message;
            break;
          case "Message Update":
            vararray["updatedmessageold"] = varsE.oldmessage;
            vararray["updatedmessagenew"] = varsE.newmessage;
            break;
          case "Role Create":
            vararray["createdrole"] = varsE.role;
            break;
          case "Role Delete":
            vararray["deletedrole"] = varsE.role;
            break;
          case "Role Update":
            vararray["updatedrolenew"] = varsE.newrole;
            vararray["updatedroleold"] = varsE.oldrole;
            break;
          case "Typing Start":
            vararray["typingstartchannel"] = varsE.channel;
            vararray["typingstartuser"] = varsE.user;
            break;
          case "User Update":
            vararray["updatedusernew"] = varsE.newuser;
            vararray["updateduserold"] = varsE.olduser;
            break;
          case "Any Message":
            vararray["anymessagemember"] = varsE.member;
            vararray["anymessage"] = varsE.message;
            break;
          case "Button Interaction":
            vararray["buttoninteraction"] = varsE.buttoninteraction;
            break;
          case "Select Interaction":
            vararray["selectinteraction"] = varsE.selectinteraction;
            break;
          case "Command Interaction":
            vararray["commandinteraction"] = varsE.commandinteraction;
            break;
          default:
            break;
        }
        vararray[applicableEvent.var.user] = varsE;
        cVars.variables = vararray;
        cache[guild.id] = cVars;
      }
    }
  } else {
    applicableEvent = aEvent;
  }
  if (applicableEvent && breakFailure) {
    if (index < applicableEvent.actions.length) {
      var action = applicableEvent.actions[index];
      action.guild = varsE.guild;
      await this.RunAction(client, action, type, index, varsE);
      //dbs.callNextEventAction(type, varsE, index + 1);
      this.Event_Handle(DBS, "", index + 1, "", varsE, applicableEvent);
    }
  } else {
    console.log("Failed to find event: " + type);
  }
  console.log(cache[guild.id]);
};

module.exports.RunAction = async function (client, action) {
  var parsedAction = ParseActionVariables(action);
  console.log("parsed:");
  console.log(parsedAction);
  switch (parsedAction.type) {
    case "Send Message":
      await SendMessage(client, parsedAction);
      break;
    case "Send Image":
      await SendImage(client, parsedAction);
      break;
    case "Send Embed":
      await SendEmbed(client, parsedAction);
      break;
    case "Send Direct Message":
      await SendDirectMessage(client, parsedAction);
      break;
    case "Add Role to User":
      AddRoletoUser(client, parsedAction);
      break;
    case "Set User Data":
      SetUserData_Handle(client, parsedAction);
      break;
    case "Get User Data":
      StoreValueinVariable_Handle(client, parsedAction);
      break;
    case "Edit User Data":
      EditUserData(client, parsedAction);
      break;
    case "Check User Data":
      this.CheckUserData(client, parsedAction);
      break;
    case "Get Row":
      GetRow_Handle(client, parsedAction);
      break;
    case "Generate Random Number":
      StoreValueinVariable_Handle(client, parsedAction);
      break;
    case "Edit Variable":
      EditVariable_Handle(client, parsedAction);
      break;
    case "Check Variable Value":
      this.CheckVariableValue_Handle(client, parsedAction);
      break;
    case "Check User Permissions":
      this.CheckUserPermissions_Handle(client, parsedAction);
      break;
    case "Remove Role From User":
      RemoveRoleFromUser(client, parsedAction);
      break;
    case "Check If Variable Exists":
      this.IfVarExists_Handle(client, parsedAction);
      break;
    case "Delete Message":
      this.DeleteMessage_Handle(client, parsedAction);
      break;
    case "Wait":
      await this.Wait_Handle(client, parsedAction);
      break;
    case "Create Category":
      this.CreateCategory_Handle(client, parsedAction);
      break;
    case "Create Channel":
      this.CreateChannel_Handle(client, parsedAction);
      break;
    case "Delete Channel":
      this.DeleteChannel_Handle(client, parsedAction);
      break;
    case "Delete All Messages":
      this.DeleteAllMessages_Handle(client, parsedAction);
      break;
    case "Check If Message Is In Channel":
      this.CheckIfMessageIsInChannel_Handle(client, parsedAction);
      break;
    case "Reply To Interaction With Message":
      this.ReplyToInteractionWithMessage(client, parsedAction);
      break;
    case "Add Role to Server":
      this.AddRoletoServer_Handle(client, parsedAction);
      break;
    case "Set Bot Status":
      this.SetBotStatus_Handle(client, parsedAction);
      break;
    case "Set Bot Activity":
      this.SetBotActivity_Handle(client, parsedAction);
      break;
    case "Set Avatar":
      this.SetAvatar_Handle(client, parsedAction);
      break;
    case "Update Channel Permissions":
      this.UpdateChannelPermissions_Handle(client, parsedAction);
      break;
    case "Switch Case":
      this.SwitchCase_Handle(client, parsedAction);
      break;
    case "Check If Array Contains Value":
      this.CheckIfArrayContainsValue_Handle(client, parsedAction);
      break;
    case "Get Interaction Option":
      StoreValueinVariable_Handle(client, parsedAction);
      break;
    case "Check If User Has Role":
      this.CheckIfUserHasRole_Handle(client, parsedAction);
      break;
    case "Check If String Contains":
      this.CheckIfStringContains_Handle(client, parsedAction);
      break;
    case "Delete Interaction Reply":
      await this.DeleteInteractionReply_Handle(client, parsedAction);
      break;
    case "Kick User":
      this.KickUser_Handle(client, parsedAction);
      break;
    case "Ban User":
      this.BanUser_Handle(client, parsedAction);
      break;
    case "Edit Message":
      this.EditMessage_Handle(client, parsedAction);
      break;
  }
};

module.exports.EditMessage_Handle = async function (client, action) {
  let chan = FindChannel(action.guild, action.channelname);
  console.log(chan);
  let message = await chan.messages.fetch(action.messageid);
  message.edit({ content: action.messagetext });
};

module.exports.KickUser_Handle = function (client, action) {
  let guild = action.guild;
  let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
  console.log(guild);
  console.log(mem);

  let reason = action.reason;

  if (mem) {
    mem
      .kick(reason)
      .then((m) => {
        console.log("Kicked member");
      })
      .catch((e) => {
        console.log(e);
      });
  } else {
    console.log("ERROR: Member to be kicked not found");
  }
};

module.exports.BanUser_Handle = function (client, action) {
  let guild = action.guild;
  var member = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);

  var options = {};
  options.reason = action.reason;
  action.days ? (options.days = action.days) : (options.days = 0);

  if (member) {
    member
      .ban(options)
      .then((member) => {
        console.log("Banned member");
      })
      .catch((e) => {
        console.log(e);
      });
  } else {
    console.log("ERROR: Member to be banned not found");
  }
};

module.exports.DeleteInteractionReply_Handle = async function (client, action) {
  if (action.interactionobject) {
    await action.interactionobject.deleteReply();
  }
};

module.exports.CheckIfStringContains_Handle = function (client, action) {
  let passActions = {};
  if (action.stringtocheck.includes(action.valuetocheck)) {
    passActions.actions = action.trueActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  } else {
    passActions.actions = action.falseActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  }
};

module.exports.CheckIfUserHasRole_Handle = function (client, action) {
  let guild = action.guild;
  let role = guild.roles.cache.find((role) => role.name == action.role || role.id == action.role);
  let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
  let passActions = {};

  if (role && mem.roles.cache.has(role.id)) {
    passActions.actions = action.trueActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  } else {
    passActions.actions = action.falseActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  }
};

module.exports.Wait_Handle = async function (client, action) {
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));
  let waitTime = action.waitduration;
  let unit = action.unit;
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
};

module.exports.CheckIfArrayContainsValue_Handle = function (client, action) {
  let passActions = {};
  if (action.varname.includes(action.value)) {
    passActions.actions = action.trueActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  } else {
    passActions.actions = action.falseActions;
    this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
  }
};

module.exports.SwitchCase_Handle = function (client, action) {
  let guild = action.guild;

  for (key of Object.keys(action.valueActions)) {
    if (action.varname == key) {
      let passActions = {};
      passActions.actions = action.valueActions[key];
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
      break;
    }
  }
};

module.exports.UpdateChannelPermissions_Handle = async function (client, action) {
  let chan = action.guild.channels.cache.find((ch) => ch.name === action.channelname || ch.id === action.channelname);
  if (chan) {
    let permissions = {};
    let allow = action.allow === "Allow" ? true : false;
    if (action.permissions) {
      action.permissions.forEach((perm) => {
        permissions[perm] = allow;
      });
      chan.permissionOverwrites.edit(action.permid, permissions);
    }
  }
};

module.exports.SetBotStatus_Handle = async function (client, action) {
  client.user.setStatus(action.presencestatus.toLowerCase());
};

module.exports.SetBotActivity_Handle = async function (client, action) {
  let presenceData = {};
  if (action.streamurl) presenceData.url = action.streamurl;
  presenceData.name = action.activityname;
  presenceData.type = action.activitytype;
  client.user.setPresence({ activities: [presenceData] });
};

module.exports.SetAvatar_Handle = function (client, action) {
  client.user.setAvatar(action.avatar);
};

module.exports.AddRoletoServer_Handle = async function (client, action) {
  let guild = action.guild;
  let roleData = {};
  roleData.name = action.rolename;
  roleData.color = action.color;
  if (action.hoist == "BOOL_TRUE@@") roleData.hoist = true;
  if (action.mentionable == "BOOL_TRUE@@") roleData.mentionable = true;
  roleData.position = action.position;
  var role = await guild.roles.create(roleData);
  saveTypeDef(guild, action.savetovariabletype, role, action.savetovariable);
};

function saveTypeDef(currentGuild, type, value, key) {
  if (currentGuild && type && value && key) {
    if (!serverVars[currentGuild.id]) serverVars[currentGuild.id] = {};
    if (!cache[currentGuild.id]) cache[currentGuild.id] = {};
    if (!cache[currentGuild.id].variables) cache[currentGuild.id].variables = {};

    var variableObject;
    if (type === "server") {
      variableObject = serverVars[currentGuild.id];
    } else if (type === "global") {
      variableObject = globalVars;
    } else {
      variableObject = cache[currentGuild.id].variables;
    }
    variableObject[key] = value;
  }
}

async function SendMessage(client, action) {
  let RowComponents = BuildRowComponents(action);
  console.log("row components");
  console.log(RowComponents);
  var guild = action.guild;
  let chan = FindChannel(action.guild, action.channelname);

  if (!chan && action.channelname != "") {
    console.log("ERROR: No channel found with name: " + action.channelname + ". Action name: " + action.name);
  } else {
    var sent = await chan.send({ content: action.messagetext, components: RowComponents });
    saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
  }
}

async function SendImage(client, action) {
  var guild = action.guild;
  const chan = guild.channels.cache.find((ch) => ch.name === action.channelname || ch.id === action.channelname);
  if (!chan && action.channelname != "") {
    console.log("ERROR: No channel found with name: " + action.channelname + ". Action name: " + action.name);
  } else {
    let RowComponents = BuildRowComponents(action);
    var sent = await chan.send({ files: [action.url], components: RowComponents });
    saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
  }
}

async function SendEmbed(client, action) {
  var guild = action.guild;
  const Embed = new Discord.MessageEmbed()
    .setColor(action.color)
    .setTitle(action.title)
    .setURL(action.url || undefined)
    .setAuthor(action.authorname, action.authorimageurl, action.authorlink)
    .setDescription(action.description)
    .setThumbnail(action.thumbnail)
    .setImage(action.image)
    .setFooter(action.footer);
  if (action.timestamp == "BOOL_TRUE@@") {
    Embed.setTimestamp();
  }

  if (action.fields) {
    action.fields.forEach((field) => {
      var inlineTrue = field.inline == "true";
      if (field.name !== "" && field.value !== "") Embed.addField(field.name, field.value, inlineTrue);
    });
  }

  const chan = guild.channels.cache.find((ch) => ch.name === action.channelname || ch.id === action.channelname);
  // Validate channel
  if (!chan && action.channelname != "") {
    console.log("ERROR: No channel found with name: " + action.channelname + ". Action name: " + action.name);
  } else {
    let RowComponents = BuildRowComponents(action);
    var sent = await chan.send({ embeds: [Embed], components: RowComponents });
    saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
  }
}

async function SendDirectMessage(client, action) {
  var guild = action.guild;
  var member = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);

  if (!member) {
    console.log("ERROR: No user found for direct message");
  } else {
    var sent = await member.send({ content: action.messagetext });
    saveTypeDef(guild, action.savetovariabletype, sent, action.savetovariable);
  }
}

function AddRoletoUser(client, action) {
  var guild = action.guild;
  var member = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
  if (!member) {
    console.log("ERROR: No user found to give role");
  } else {
    var rolel = guild.roles.cache.find((role) => role.name == action.rolename || role.id == action.rolename);
    if (!rolel) {
      console.log("ERROR: No role found to give role");
    } else {
      member.roles.add(rolel);
    }
  }
}

function RemoveRoleFromUser(client, action) {
  var guild = action.guild;
  console.log("removing role");
  console.log(typeof action.user);
  let removeUser = GetUserByTagOrId(guild, action.user);
  let role = guild.roles.cache.find((role) => role.name == action.rolename || role.id == action.rolename);
  if (removeUser && role) {
    removeUser.roles.remove(role, action.reason).catch(console.error);
  }
}

function SetUserData_Handle(client, action) {
  var guild = action.guild;
  let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
  if (!userCache[mem.id]) {
    userCache[mem.id] = {};
  }
  let valToSet = null;
  if (!isNaN(action.fieldvalue)) {
    valToSet = parseInt(action.fieldvalue);
  } else {
    valToSet = action.fieldvalue;
  }
  userCache[mem.id][action.field] = valToSet;
}

module.exports.CheckUserData = function (client, action) {
  var guild = action.guild;
  let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
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
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
      } else {
        passActions.actions = action.falseActions;
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
      }
    }
  }
};

function EditUserData(client, action) {
  var guild = action.guild;
  let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);

  if (!userCache[mem.id]) {
    userCache[mem.id] = {};
    userCache[mem.id][action.field] = 0;
  }

  if (!userCache[mem.id][action.field]) {
    userCache[mem.id][action.field] = 0;
  }

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

function GetUserData(client, action) {}

function ParseActionVariables(action) {
  var guild = action.guild;

  var dbsVars = {};

  dbsVars["DefaultChannel"] = Functions.getDefaultChannel(guild);
  dbsVars["guild"] = guild;
  var injectVariables = {};
  injectVariables.dbsVars = dbsVars;
  injectVariables.serverVars = serverVars[action.guild.id];
  injectVariables.tempVars = cache[action.guild.id].variables;
  injectVariables.globalVars = globalVars;

  var newaction = Object.assign({}, action);
  regex = /%%(\w+)\[([\w\s]+)\]%%/g; ///%%(.*?)%%/g;
  var regex1 = /%%(.*?)%%/g;
  var varRegex = /\${(.*?)}/g;
  // Get the array of current variables
  Object.keys(newaction).forEach((e) => {
    try {
      if (action[e] === "${tempVars.buttoninteraction}") {
        newaction[e] = injectVariables.tempVars.buttoninteraction;
      }
      if (action[e] === "${tempVars.commandinteraction}") {
        newaction[e] = injectVariables.tempVars.commandinteraction;
      }
      if (action[e] === "${tempVars.selectinteraction}") {
        newaction[e] = injectVariables.tempVars.selectinteraction;
      }
      if (
        e !== "trueActions" &&
        e !== "falseActions" &&
        e !== "fields" &&
        e !== "permissions" &&
        e !== "guild" &&
        e !== "authorimageurl" &&
        e !== "authorimageurl" &&
        e !== "messageActionRows" &&
        e !== "valueActions" &&
        e !== "interactionobject"
      ) {
        var newVal = newaction[e];
        newVal = newVal.replace("$$DefaultChannel$$", Functions.getDefaultChannel(guild));
        newVal = newVal
          .replace("$$ServerIcon$$", guild.iconURL)
          .replace("$$MemberCount$$", guild.memberCount.toString())
          .replace("$$JoinedAt$$", guild.joinedAt.toString())
          .replace("$$ServerName$$", guild.name)
          .replace("$$ServerOwner$$", guild.ownerId)
          .replace("$$ServerRegion$$", guild.region)
          .replace("${dbsVars.CommandAuthor.user.dmChannel}", "@@MSG_AUTHOR@@")
          .replace("$$VerificationLevel$$", guild.verificationLevel.toString());
        newaction[e] = newVal;
      } else if (e === "fields") {
        Array.prototype.forEach.call(newaction[e], (child) => {
          var newVal = child.value;
          newVal = newVal.replace("$$DefaultChannel$$", Functions.getDefaultChannel(guild));
          newVal = newVal
            .replace("$$ServerIcon$$", guild.iconURL)
            .replace("$$MemberCount$$", guild.memberCount.toString())
            .replace("$$JoinedAt$$", guild.joinedAt.toString())
            .replace("$$ServerName$$", guild.name)
            .replace("$$ServerOwner$$", guild.ownerId)
            .replace("$$ServerRegion$$", guild.region)
            .replace("${dbsVars.CommandAuthor.user.dmChannel}", "@@MSG_AUTHOR@@")
            .replace("$$VerificationLevel$$", guild.verificationLevel.toString());
          child.value = newVal;
        });
      }
    } catch (err) {
      DBS.logError({ level: "error", message: err.stack });
    }
    //console.log(`key=${e}  value=${action[e]}`)
  });

  Object.keys(newaction).forEach((e) => {
    try {
      if (
        e !== "trueActions" &&
        e !== "falseActions" &&
        e !== "fields" &&
        e !== "permissions" &&
        e !== "guild" &&
        e !== "authorimageurl" &&
        e !== "authorimageurl" &&
        e !== "messageActionRows" &&
        e !== "valueActions" &&
        e !== "interactionobject"
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
        /*newaction[e].foreach(fieldString => {
                    consolg.log(fieldString);
                });*/
        Array.prototype.forEach.call(newaction[e], (child) => {
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
      }
    } catch (err) {
      DBS.logError({ level: "error", message: err.stack });
    }
  });
  //}
  return newaction;
}

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

function GetInteractionOption(interaction, optionname) {
  let option = interaction.options.get(optionname);
  if (option.value) {
    return option.value;
  } else {
    return null;
  }
}

function StoreValueinVariable_Handle(client, action) {
  var variableObject = {};
  var paramValue;
  var guild = action.guild;
  // Save variable to temp/server/global vars.
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

    // Save based on the node type
    if (action.type === "Get Command Author") {
      let found = msg.author;
      paramValue = found.id;
    } else if (action.type === "Get User Data") {
      let mem = guild.members.cache.find((gm) => gm.user.tag == action.user || gm.user.id == action.user);
      if (userCache[mem.id]) {
        paramValue = userCache[mem.id][action.field];
      }
    } else if (action.type === "Get Interaction Option") {
      console.log("saving interaction object");
      paramValue = GetInteractionOption(action.interactionobject, action.commandoptionname);
    } else if (action.type === "Generate Random Number") {
      if (!isNaN(Number(action.min)) && !isNaN(Number(action.max))) {
        paramValue = Math.floor(Math.random() * (Number(action.max) - Number(action.min) + 1) + Number(action.min)).toString();

        action.vartype = "Number";
      }
    } else if (action.type === "Get Command Channel") {
      paramValue = msg.channel.name;
    } else if (action.vartype == "User") {
      let found = msg.mentions.members.first();
      paramValue = found;
    } else if (action.param == 0) {
      paramValue = msg.content.substr(msg.content.indexOf(" ") + 1);
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
          message: "ERROR converting value: " + paramValue + " to number",
        });
      }
    }
    variableObject[action.varname] = paramValue;
  }
}

function contains(arr, key, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) return true;
  }
  return false;
}

function GetRow_Handle(client, action) {
  var guild = action.guild;

  var objectToAdd = {};
  const csvFile = fs.readFileSync(path.resolve(__dirname, "../BotData/sheets/" + action.selectedsheet));
  const csvData = csvFile.toString();
  Papa.parse(csvData, {
    header: true,
    complete: function (results, file) {
      var foundValue = results.data.filter((obj) => obj[action.colheader] === action.colval);
      if (foundValue.length > 0) {
        objectToAdd[action.rowvariable] = foundValue[0];
        if (!cache[guild.id]) cache[guild.id] = {};
        let vars = cache[guild.id];
        if (!vars.variables) vars.variables = [];
        let vararray = vars.variables;
        if (contains(vararray, "name", action.rowvariable)) {
          var existingvar = vararray.find((vari) => vari.name == action.rowvariable);
          existingvar.value = foundValue[0];
          existingvar.type = "row";
        } else {
          vararray.push({
            name: action.rowvariable,
            value: foundValue[0],
            type: "row",
          });
        }
        vars.variables = vararray;
        cache[guild.id] = vars;
      } else {
        breakFailure = false;
      }
    },
  });
}

function EditVariable_Handle(client, action) {
  var guild = action.guild;

  if (!isNaN(Number(action.value))) {
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
}

module.exports.CheckVariableValue_Handle = function (client, action) {
  var trueOrFalse = null;
  var guild = action.guild;

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
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
      } else {
        passActions.actions = action.falseActions;
        this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
      }
    }
  }
};

module.exports.CheckUserPermissions_Handle = function (client, action) {
  var guild = action.guild;

  var mem = GetUserByTagOrId(guild, action.user);
  var hasPerms;
  if (mem) {
    var passActions = {};
    if (action.permissions.length === 0) {
      hasPerms = true;
    } else {
      if (mem.hasPermission(action.permissions)) {
        hasPerms = true;
      } else {
        hasPerms = false;
      }
    }
    if (hasPerms) {
      passActions.actions = action.trueActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    } else {
      passActions.actions = action.falseActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    }
  } else {
    console.log("Member not found with tag/id: " + action.user);
  }
};

module.exports.IfVarExists_Handle = function (client, action) {
  var trueOrFalse = null;
  var guild = action.guild;
  console.log("checking if exists");

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
      console.log("true");
      passActions.actions = action.trueActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    } else {
      console.log("false");
      passActions.actions = action.falseActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    }
  }
};

module.exports.DeleteMessage_Handle = async function (client, action) {
  let chan = FindChannel(action.guild, action.channelname);
  client.channels.cache
    .get(chan.id)
    .messages.fetch(action.varname)
    .then((message) => message.delete());
};

module.exports.CreateCategory_Handle = async function (client, action) {
  let server = action.guild;
  let chan = await server.channels.create(action.categoryname, {
    type: "category",
  });
};

module.exports.CreateChannel_Handle = async function (client, action) {
  let server = action.guild;
  let chan;
  let channeltype = action.channeltype.toLowerCase() === "text" ? "GUILD_TEXT" : "GUILD_VOICE";
  if (action.chancategory) {
    chan = await server.channels.create(action.channelname, {
      type: channeltype,
      reason: action.reason,
      parent: server.channels.cache.find((ct) => ct.name.toLowerCase() === action.chancategory.toLowerCase() || ct.id === action.chancategory),
    });
  } else {
    chan = await server.channels.create(action.channelname, {
      type: channeltype,
      reason: action.reason,
    });
  }
  saveTypeDef(server, action.savetovariabletype, chan, action.savetovariable);
};

module.exports.DeleteChannel_Handle = function (client, action) {
  var fetchedChannel = FindChannel(action.guild, action.channelname);
  if (fetchedChannel) {
    fetchedChannel.delete();
  }
};

module.exports.DeleteAllMessages_Handle = async function (client, action) {
  const chan = FindChannel(action.guild, action.channelname);
  // Validate channel
  if (chan) {
    await chan
      .bulkDelete(action.msgcount)
      .then((messages) => console.log(`Bulk deleted ${messages.size} messages`))
      .catch(console.error);
  }
};

module.exports.CheckIfMessageIsInChannel_Handle = async function (client, action) {
  let chan = FindChannel(action.guild, action.channelname);
  if (chan) {
    let trueOrFalse = chan.id == action.messageid;
    let passActions = {};

    if (trueOrFalse === true) {
      passActions.actions = action.trueActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    } else {
      passActions.actions = action.falseActions;
      this.Event_Handle(DBS, "", 0, "", varsEToPass, passActions);
    }
  }
};

module.exports.ReplyToInteractionWithMessage = async function (client, action) {
  console.log("action interaction");
  if (action.interactionobject) {
    // let eph = false;
    // if (action.ephemeral === "BOOL_TRUE@@") {
    //     eph = true;
    // }
    action.interactionobject.followUp({ content: action.messagetext });
  }
};

function GetUserByTagOrId(guild, tagorid) {
  // User vars stored in <@123456> format should be replaced with just the id
  if (tagorid.startsWith("<@")) {
    tagorid = tagorid.replace("<", "").replace(">", "").replace("@", "");
  }
  var mem = guild.members.cache.find((gm) => gm.user.tag == tagorid || gm.user.id == tagorid);
  return mem;
}

function FindChannel(guild, channel) {
  return guild.channels.cache.find((ch) => ch.name === channel || ch.id === channel) || DBS.Bot.users.cache.get(channel);
}

function BuildRowComponents(action) {
  let rowComponents = [];
  let returnRows = [];
  //console.log(action.messageActionRows);
  if (action.messageActionRows) {
    action.messageActionRows.forEach((row) => {
      if (row.rowtype === "select" && row.customid && row.selectoptions.length > 0) {
        let menu = new Discord.MessageSelectMenu();
        menu.setCustomId(row.customid);
        if (row.placeholdertext) menu.setPlaceholder(row.placeholdertext);
        if (row.minValue) menu.setMinValues(parseInt(row.minValue));
        if (row.maxValue) menu.setMaxValues(parseInt(row.maxValue));
        if (row.selectoptions) {
          let options = [];
          row.selectoptions.forEach((option) => {
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
          row.buttons.forEach((button) => {
            let newbutton = new Discord.MessageButton();
            if (button.label) newbutton.setLabel(button.label);
            // Link buttons cannot have customid and dont fire an event
            if (button.customid && button.style !== "LINK") newbutton.setCustomId(button.customid);
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

// Console log color defs
var BgYellow = "\x1b[43m";
