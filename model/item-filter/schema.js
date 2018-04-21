const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const itemFilterSchema = new Schema({
  name: String,
  description: String,
  filters: Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = itemFilterSchema;