// This is the database adapter service class
const { Service } = require('feathers-memory');
// We need this to create the MD5 hash
const crypto = require('crypto');
const uuid = require('uuid');

// The Gravatar image service
const gravatarUrl = 'https://s.gravatar.com/avatar';
// The size query. Our chat needs 60px images
const query = 's=60';

exports.Users = class Users extends Service {
  async create (data, params) {
    // This is the information we want from the user signup data
    const { email, githubId, password } = data;
    // Gravatar uses MD5 hashes from an email address (all lowercase) to get the image
    const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    // The full avatar URL
    const avatar = `${gravatarUrl}/${hash}?${query}`;
    // The complete user
    const userData = {
      email,
      password,
      githubId,
      avatar,
      id: uuid.v4()
    };

    if((await this.find({query: {email}})).total) {
      console.log('user already exists: ', email);
    } else {
      // Call the original `create` method with existing `params` and new data
      return super.create(userData, params);
    }
  }

  async find(... args) {
    let res = await super.find(... args);
    console.log('Find', args[0].query, res.total);
    return res;
  }
};
