module.exports.getDefaultChannel = function (guild) {
    var channel;
    guild.channels.cache.forEach(function (c) {
        if (c.type === "GUILD_TEXT") {
            if (!channel) {
                channel = c;
            } else if (channel.position > c.position) {
                channel = c;
            }
        }
    });
    return channel;
};
