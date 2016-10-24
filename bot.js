'use strict';

const ConfuciusBot = require('./bin/confucius');

let token = "Please inject your own token here.";
let dbPath = process.env.BOT_DB_PATH;
let name = process.env.BOT_NAME;

let confuciusbot = new ConfuciusBot({
    token: token,
    dbPath: dbPath,
    name: name
});

confuciusbot.run();
