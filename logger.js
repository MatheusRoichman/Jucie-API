const { createLogger, transports, format } = require('winston');
const moment = require('moment');

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const customLogger = createLogger({
  levels: logLevels,
  transports: [
    new transports.File({
      filename: `./logs/express-${moment().format('YYYY-MM-DD')}.log`
    })
  ],
  format: format.combine(format.timestamp(), format.simple())
});

const log = (feature, message, exception) => exception ? customLogger.error(`[${feature}] ${message}: ${exception}`) : customLogger.info(`[${feature}] ${message} `);

module.exports = { customLogger, log };