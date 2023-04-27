const fs = require("fs");
var usersFile = __dirname + "/user/user.json";
let userdata = fs.readFileSync(usersFile);
let uData = JSON.parse(userdata);
module.exports.memoryCache = uData;
