// This is the database adapter service class
const { Service } = require('feathers-memory');
// We need this to create the MD5 hash
const crypto = require('crypto');
const uuid = require('uuid');

const inMemoryAvatar = require('../avatars/InMemoryAvatar');

exports.Users = class Users extends Service {
  async create (data, params) {
    // This is the information we want from the user signup data
    const { email, githubId, password, imageData, isPlaying } = data;
    // Gravatar uses MD5 hashes from an email address (all lowercase) to get the image
    const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    // The full avatar URL
    // The complete user
    const userData = {
      email,
      password,
      githubId,
      isPlaying,
      id: uuid.v4()
    };

    if((await this.find({query: {email}})).total) {
      console.log('user already exists: ', email);
    } else {
      if(imageData) {
        userData.avatar = await inMemoryAvatar.create({userId: userData.id, imageData});
      }
      // Call the original `create` method with existing `params` and new data
      let userResponse = await super.create(userData, params);
      return userResponse;
    }
  }

  async update(id, {imageData, ... updatedData}, params) {
    let user = await this.get(id);

    // only let a user change its own fields
    if(user && id === params.user.id) {
      if(imageData) {
        updatedData.avatar = await inMemoryAvatar.create({userId: id, imageData});
      }
      console.log("UPDATED", id, updatedData)
      return super.update(id, {... user, ... updatedData});
    } else {
      throw new Error('Invalid update')
    }
  }

  async find(... args) {
    let res = await super.find(... args);
    console.log('Find', args[0].query, res.total);
    return res;
  }
};
