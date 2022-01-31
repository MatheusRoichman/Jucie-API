const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const morganBody = require('morgan-body');
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

require("dotenv").config();

const app = express();

app.use(cookieParser());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(express.json());

const log = fs.createWriteStream(
  path.join(__dirname, "./logs", `express${moment().format('YYYY-MM-DD')}.log`), { flags: "a" }
);

morganBody(app, {
  noColors: true,
  stream: log,
});

const mongodbUrl = {
  dev: 'mongodb://0.0.0.0:27017/jucie-dev',
  prod: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ykbsq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
}

app.use('/produtos', productRoutes);
app.use('/auth', authRoutes);

mongoose.connect(mongodbUrl.dev).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.log('Error on connecting to MongoDB: ' + err);
});

app.listen(3000);