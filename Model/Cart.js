const mongoose = require("mongoose");
const CartSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  id_User: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  totalSum: { type: Number, required: true },
  timeCart: { type: String, required: true },
  cart: { type: Array, required: true },
  payment: { type: String, required: true },
  success: { type: Boolean, required: true },
  status_order: { type: Boolean, required: true },
  message: { type: String, default: '' }
});

module.exports = mongoose.model('Cart', CartSchema);