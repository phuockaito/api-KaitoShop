const mongoose = require("mongoose");
const ViewSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  View: { type: Number, required: true }
});

module.exports = mongoose.model('View', ViewSchema);