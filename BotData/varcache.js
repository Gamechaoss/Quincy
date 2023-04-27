var cache = {};
module.exports.memoryCache = cache;

/**
 * Replaces variables found in action content with the matching values in cache
 */
module.exports.ParseAction = function (action, guild) {
    var newaction = Object.assign({}, action);
    if (action.fields) {
        newaction.fields = JSON.parse(JSON.stringify(action.fields));
    } else {
        newaction.fields = [];
    }

    var regex = /%%(\w+)\[([\w\s]+)\]%%/g;
    var regex1 = /%%(.*?)%%/g;

    if (this[guild.id]) {
        var vars = this[guild.id];
        this[guild.id].variables.forEach(sv => {
            if (sv.type == "Text" || sv.type == "Number" || sv.type == "User" || sv.type == "Channel" || sv.type == "row") {
                vars[sv.name] = sv.value;
            }
        });
        Object.keys(newaction).forEach(e => {
            try {
                if (e !== "trueActions" && e !== "falseActions" && e !== "fields") {
                    var newVal = newaction[e].replace(regex, (_match, group1, group2) => vars[group1][group2]);
                    console.log(newVal);

                    newVal = newVal.replace(regex1, (_match, group1) => vars[group1]);
                    newaction[e] = newVal;
                } else if (e === "fields") {
                    Array.prototype.forEach.call(newaction[e], child => {
                        var newValF = child.value.replace(regex, (_match, group1, group2) => vars[group1][group2]);
                        newValF = newValF.replace(regex, (_match, group1) => vars[group1]);
                        child.value = newValF;
                    });
                }
            } catch (err) {
                console.log(err);
            }
        });
    }
    return newaction;
};
