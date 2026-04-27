process.env["NODE_CONFIG_DIR"] = __dirname + "/../config";

/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app');

const port = process.env.PORT || app.get('port');

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

console.log("Listening in port "+port);

let httpServer;
app.listen(port).then((server) => {
  httpServer = server;
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port);
});

// Handle Heroku's SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing HTTP server...');
  if (!httpServer) return process.exit(0);
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
