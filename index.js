const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const productRoutes = require('./routes/productRoutes');
const loginRoutes = require('./routes/authRoutes');

require("dotenv").config();

const app = express();

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(express.json());

const mongodbUrl = {
  dev: 'mongodb://0.0.0.0:27017/jucie-dev',
  prod: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ykbsq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
}

app.use('/produto', productRoutes);
app.use('/auth', loginRoutes);

mongoose.connect(mongodbUrl.dev).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.log('Error on connecting to MongoDB: ' + err);
});

app.listen(3000);