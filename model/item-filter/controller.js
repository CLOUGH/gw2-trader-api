const Controller = require('../../lib/controller');
const itemFilterFacade = require('./facade');

class ItemFilterController extends Controller {}

module.exports = new ItemFilterController(itemFilterFacade);
