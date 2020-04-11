const {Service} = require('feathers-memory');
const {isEmoji, findEmojis} = require('./../../emojis');

exports.Messages = class Messages extends Service {
  async create(data, params) {
    // Check if it is a emoji, or a chain of emojis, and don't save it if it is
    if (!data || !data.text || isEmoji(data.text) || findEmojis(data.text).join('') === data.text) {
      // Ignore emojis
      return {...data, id: Math.random().toString()};
    } else {
      return await super.create(data, params);
    }
  }
};
