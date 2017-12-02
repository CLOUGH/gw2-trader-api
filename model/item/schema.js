const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const schema = new Schema({
  any: Schema.Types.Mixed
});

module.exports = schema;