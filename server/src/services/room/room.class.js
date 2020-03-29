const _ = require('lodash')

exports.Room = class Room {
  constructor() {
    this.people = [];
  }

  async create (data) {
    const { user } = data;
    this.people = _.uniqBy([... this.people, user], 'id');
    return user;
  }

  async remove(userId) {
    const removed = _.find(this.people, u => u.id == userId);
    this.people = _.without(this.people, removed);
    return removed;
  }

  async find() {
    return this.people;
  }
};
