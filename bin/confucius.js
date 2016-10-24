'use strict';

let path = require('path');
let fs = require('fs');
let SQLite = require('sqlite3').verbose();
let Bot = require('slackbots');

class ConfuciusBot extends Bot {
  constructor(settings) {
    super(settings);
    this.settings = settings;
    this.settings.name = this.settings.name || 'confucius';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), './db/',
    'confucius.db');

    this.user = null;
    this.db = null;
  }

  run() {
    // ConfuciusBot.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
  }

  _onStart() {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
  }

  _loadBotUser() {
    this.user = this.users.filter((user) => {
          return user.name === this.settings.name;
      })[0];
  }

  _connectDb() {
    if (!fs.existsSync(this.dbPath)) {
      console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
      process.exit(1);
    }
    this.db = new SQLite.Database(this.dbPath);
  }

  _firstRunCheck() {
    this.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', (err, record) => {
      if (err) {
        return console.error("Database error: ", err);
      }

      let currentTime = (new Date()).toJSON();

      if (!record) {
        this._welcomeMessage();
        return this.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
      }

      this.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
  }

  _welcomeMessage() {
    this.postMessageToChannel(this.channels[0].name, `I hear and
      I forget. I see and I remember. I do and I understand.
      \nIf you want more wise programming advice. Summon me with
      \'Confucius Says\' or ${this.name}.`, {as_user: true} );
  }

  _onMessage(message) {
    if (this._checkMessage(message)) {
        this._replyWithWisdom(message);
    }
  }

  _isChatMessage(message) {
      return message.type === 'message' && Boolean(message.text);
  }

  _isChannelConversation(message) {
      return typeof message.channel === 'string' &&
          message.channel[0] === 'C';
  }

  _isNotFromConfuciusBot(message) {
      return message.user !== this.user.id;
  }

  _isMentioningConfuciusSays(message) {
      return message.text.toLowerCase().indexOf('confucius says') > -1 ||
          message.text.toLowerCase().indexOf(this.name) > -1;
  }

  _checkMessage(message) {
    return this._isChatMessage(message) &&
      this._isChannelConversation(message) &&
      this._isNotFromConfuciusBot(message) &&
      this._isMentioningConfuciusSays(message);
  }

  _replyWithWisdom(incomingMessage) {
    this.db.get('SELECT rowid AS id, * FROM advices ORDER BY RANDOM() LIMIT 1',
    (err, record) => {
      if (err) { return console.log("DATABASE ERROR:", err); }
      let channel = this._getChannelById(incomingMessage.channel);
      this.postMessageToChannel(channel.name, record.info, {as_user: true});
      this.db.run('UPDATE advices SET used = used + 1 WHERE rowid = ?',
      record.id);
    });
  }

  _getChannelById(channelId) {
    return this.channels.filter((channel) => channel.id === channelId)[0];
  }
}

module.exports = ConfuciusBot;
