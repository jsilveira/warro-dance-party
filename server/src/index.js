/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app');

const port = process.env.PORT || app.get('port');

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

console.log("Listenning in port "+port);

const server = app.listen(port).then(() => {
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port);
});

// Handle Heroku's SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
