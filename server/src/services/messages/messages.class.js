const {Service} = require('feathers-memory');
const {isEmoji} = require('./../../emojis');

exports.Messages = class Messages extends Service {
  async create(data, params) {
    // Check if it is a emoji, and don't save it
    if (data && data.text && !isEmoji(data.text)) {
      return await super.create(data, params);
    } else {
      // Ignore emojis
      return {...data, id: Math.random().toString()};
    }
  }
};
