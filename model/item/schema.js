const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const itemSchema = new Schema({
  any: Schema.Types.Mixed
});


module.exports = itemSchema;