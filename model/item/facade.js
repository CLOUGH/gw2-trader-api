const Facade = require('../../lib/facade');
const itemSchema = require('./schema');

class ItemFacade extends Facade {}

module.exports = new ItemFacade('Item', itemSchema);
