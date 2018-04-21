const Facade = require('../../lib/facade');
const itemFilterSchema = require('./schema');

class ItemFilterFacade extends Facade {}

module.exports = new ItemFilterFacade('ItemFilter', itemFilterSchema);
