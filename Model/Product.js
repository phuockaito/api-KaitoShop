const mongoose = require("mongoose");
const moment = require('moment');
const createdAt = moment().format();
const productSchema = mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  size: { type: Array, required: true },
  price: { type: Number, required: true },
  numReviews: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  sex: { type: String, required: true },
  color: { type: Array, required: true },
  poster: { type: Array, required: true },
  description: { type: String, required: true },
  collections: { type: String, required: true },
  productType: { type: String, required: true },
  key: { type: String, required: true },
  NSX: { type: String, required: true },
  createdAt: { type: String, default: createdAt }
});
module.exports = mongoose.model('product', productSchema);