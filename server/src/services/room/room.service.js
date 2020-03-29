// Initializes the `users` service on path `/users`
const hooks = require('./room.hooks');
const {Room} = require('./room.class');

module.exports = function (app) {

  // Initialize our service with any options it requires
  app.use('/room', new Room(app));

  // Get our initialized service so that we can register hooks
  const service = app.service('room');

  service.hooks(hooks);
};
