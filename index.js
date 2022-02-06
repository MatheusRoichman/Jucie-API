const express = require('express');
const mongoose = require('mongoose');

const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const { customLogger } = require('./logger');
const { createLogger, transports, format } = require('winston');
const moment = require('moment');
const morganBody = require('morgan-body');

require("dotenv").config();

const app = express();

app.use(cookieParser());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(express.json());

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logger = createLogger({
  levels: logLevels,
  transports: [
    new transports.File({
      filename: `./logs/express-${moment().format('YYYY-MM-DD')}.log`
    })
  ],
  format: format.combine(format.timestamp(), format.simple())
});

const loggerStream = {
  write: message => {
    logger.info(message);
  },
};

const morganBodyConfig = {
  noColors: true,
  logAllReqHeader: true,
  logRequestId: true,
  logAllResHeader: true
};

morganBody(app, {
  ...morganBodyConfig,
  stream: loggerStream
});

app.use('/products', productRoutes);
app.use('/users', userRoutes);

const mongodbUrl = {
  dev: 'mongodb://0.0.0.0:27017/jucie-dev',
  prod: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ykbsq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
}

mongoose.connect(mongodbUrl.dev).then(() => {
  customLogger.info('Connected to MongoDB');
}).catch(err => {
  customLogger.info('Error on connecting to MongoDB: ' + err);
});

app.listen(3000);