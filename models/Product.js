const mongoose = require('mongoose');

const Product = mongoose.model('Product', {
  name: String,
  price: Number,
  category: String,
  imageUrl: String,
  amount: Number,
  _id: String
});

module.exports = Product;