const Controller = require('../../lib/controller');
const itemFacade = require('./facade');
const axios = require('axios');
const TaskQueue = require('cwait').TaskQueue;
const Promise = require('bluebird');
const _ = require('lodash');

class ItemController extends Controller {

  constructor(facade) {
    super(facade);
    this.gw2ApiUrl = 'https://api.guildwars2.com/v2';
    this.gw2Spidy = 'http://www.gw2spidy.com/api/v0.9/json';
    this.gw2Shinies = 'https://www.gw2shinies.com/api/json/';
    this.MAX_SIMULTANEOUS_DOWNLOADS = 100;
    this.itemsPerRequest = 200;
  }

  syncItems(req, res, next) {
    req.io.emit('/items/sync', {
      message: 'Getting item ids'
    });

    // get items
    this.getItemIds(next).then((response) => {
      const ids = response.data;
      const numberOfIds = ids.length;

      req.io.emit('/items/sync', {
        message: `Got ${numberOfIds} items`
      });

      const idChunks = ItemController.chunk(response.data, this.itemsPerRequest);
      let itemsDownloaded = 0;
      const queue = new TaskQueue(Promise, this.MAX_SIMULTANEOUS_DOWNLOADS);

      req.io.emit('/items/sync', {
        message: 'Building urls'
      });


      const promise = Promise.map(idChunks, queue.wrap(idChunk =>
        axios.get(`${this.gw2ApiUrl}/items?ids=${idChunk}`)
          .then((itemResponse) => {
            itemsDownloaded += itemResponse.data.length;
            req.io.emit('/items/sync', {
              message: `Downloaded ${itemsDownloaded} items of ${numberOfIds}`
            });

            const items = itemResponse.data;
            const tradingHistoryQueue = new TaskQueue(Promise, this.MAX_SIMULTANEOUS_DOWNLOADS);

            return Promise.map(items, tradingHistoryQueue.wrap(item =>
              axios.get(`${this.gw2Shinies}/history-daily/${item.id}`)
                .then((historyResponse) => {
                  item.history = historyResponse.data;
                  return item;
                })
                .catch(err => next(err))
            ));
          })
          .catch(err => next(err))
      ));


      promise.then((values) => {
        console.log(values);

        req.io.emit('/items/sync', {
          message: 'Done'
        });
      }).catch(err => next(err));
    });

    return res.json([]);
  }

  getItemIds(next) {
    return axios.get(`${this.gw2ApiUrl}/items`)
      .catch(err => next(err));
  }

  static chunk(array, size) {
    const arrays = [];

    while (array.length > 0) {
      arrays.push(array.splice(0, size));

    }
    return arrays;
  }

}

module.exports = new ItemController(itemFacade);