const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');


const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const inMemoryAvatar = require('./services/avatars/InMemoryAvatar');

const authentication = require('./authentication');

const app = express(feathers());

// Load app configuration
console.log("El param de config es "+process.env["NODE_CONFIG_DIR"])

// console.log("Favicon debería estar en "+)
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')+'/ui/'));
app.use('/', express.static(app.get('public')));

app.get('/avatars/:id', (req, res) => {
  const imgId = req.params.id;

  const avatar = inMemoryAvatar.get(imgId);

  if(avatar) {
    const {contentType, dataBytes} = avatar;

    res.writeHead(200, {
      'Cache-Control': 'public, max-age=31557600',
      'Content-Type': contentType,
      'Content-Length': dataBytes.length
    });
    res.end(dataBytes);
  } else {
    res.send(404);
  }
});

app.get('/agenda', (req, res) => {
  res.redirect(307, 'https://calendar.google.com/calendar/embed?src=pampawarro%40gmail.com&ctz=America%2FArgentina%2FBuenos_Aires');
});

app.get('/agenda-admin', (req, res) => {
  res.redirect(307, 'https://teamup.com/ksekns8wj4coffwxxn');
});

app.get('/', (req, res) => {
  res.sendfile(app.get('public') + '/ui/index.html');
});

app.get('/test', (req, res) => {
  res.sendfile(app.get('public') + '/ui/test.html');
});

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
