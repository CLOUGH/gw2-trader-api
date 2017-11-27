const Controller = require('../../lib/controller');
const itemFacade = require('./facade');
const axios = require('axios');

class ItemController extends Controller {

  constructor(facade) {
    super(facade);
    this.gw2ApiUrl = 'https://api.guildwars2.com/v2';
  }

  syncItems(req, res, next) {
    console.log('rest', req.io);
    req.io.emit('downloading item ids');
    // items
    this.getItemIds(next).then((ids) => {
      console.log(ids);
      req.io.emit('item ids downloaded');
    });

    return res.json([]);
  }

  getItemIds(next) {
    return axios.get(`${this.gw2ApiUrl}/items`)
      .catch(err => next(err));
  }
}

module.exports = new ItemController(itemFacade);