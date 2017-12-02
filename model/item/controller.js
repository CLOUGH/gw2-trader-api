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

    this.pageSize = 20;
  }

  find(req, res, next) {
    const page = req.query.page || 1;
    const pageSize = Number(req.query.limit) || this.pageSize;
    const skips = pageSize * (page - 1);
    const sort = req.query.sort || 'listings.roi';
    const sortBy = {
      'listings.roi': -1,
    };
    // sortBy[sort] = -1;

    return this.facade.model.find({
        'profit': {
          $gt: 100
        },
        'roi': {
          $lt: 50
        },
        'buy': {
          $lt: 10000,

        },
        'demand': {
          $gt: 10000
        },
        'supply': {
          $gt: 5000
        }
      }, {
        id: 1,
        name: 1,
        icon: 1,
        buy: 1,
        sell: 1,
        profit: 1,
        roi: 1,
        demand: 1,
        supply: 1,
        rarity: 1,
        level: 1
      })
      .skip(skips)
      .limit(pageSize)
      .sort(sortBy)
      .then(collection => res.status(200).json(collection))
      .catch(err => next(err));
  }

  syncItems(req, res, next) {
    req.io.emit('/items/sync', {
      message: 'Getting item ids'
    });

    console.log('Getting item ids');

    // get items
    axios.get(`${this.gw2ApiUrl}/commerce/listings`).then((response) => {
      const ids = response.data;
      this.numberOfIds = ids.length;

      this.io = req.io;

      this.io.emit('/items/sync', {
        message: `Got ${this.numberOfIds} items`
      });

      console.log(`Got ${this.numberOfIds} items`);

      this.downloaded = 0;
      this.itemsUpdated = 0;

      const idChunks = ItemController.chunk(response.data, this.itemsPerRequest);
      const queue = new TaskQueue(Promise, this.MAX_SIMULTANEOUS_DOWNLOADS);

      req.io.emit('/items/sync', {
        message: 'Building urls'
      });

      // Get the item details
      Promise.map(idChunks, queue.wrap((idChunk) => {
          const promises = [
            this.getItems(idChunk),
            this.getListings(idChunk)
          ];
          return Promise.all(promises).then((values) => {
            values[0].forEach((item) => {
              const listings = values[1].find(listing => listing.id === item.id);
              delete listings.id;

              item.buy = listings.buys.length > 0 ? listings.buys[0].unit_price : 0;
              item.sell = listings.sells.length > 0 ? listings.sells[0].unit_price : 0;
              item.profit = (item.sell - item.sell * 0.15) - item.buy;

              item.supply = listings.sells.length ? listings.sells.map(listing => listing.quantity).reduce((quantity, sell) => sell + quantity) : 0;
              item.demand = listings.buys.length ? listings.buys.map(listing => listing.quantity).reduce((quantity, buy) => buy + quantity) : 0;
              item.roi = item.sell > 0 ? item.profit / item.sell * 100 : 0;

              item.listings = listings;
            });
            return this.saveItems(values[0]);
          });
        }))
        .then((data) => {
          req.io.emit('/items/sync', {
            message: 'Done'
          });
          console.log('done');
        });
    }).catch(err => next(err));


    // save exit after all the promises have been resolved

    return res.json([]);
  }

  getListings(ids) {
    return axios.get(`${this.gw2ApiUrl}/commerce/listings?ids=${ids}`)
      .then((response) => {
        console.log('got listings');
        return response.data;
      });
  }


  getItemIds(next) {
    return axios.get(`${this.gw2ApiUrl}/items`)
      .catch(err => next(err));
  }


  getItems(itemIds) {
    return axios.get(`${this.gw2ApiUrl}/items?ids=${itemIds}`)
      .then((itemResponse) => {

        this.downloaded += itemResponse.data.length;

        this.io.emit('/items/sync', {
          message: `Downloaded ${this.downloaded} items of ${this.numberOfIds}`
        });
        console.log('getting items');

        return itemResponse.data;
      });
  }

  saveItems(items) {
    const bulks = [];
    // creating the bulk write operations
    items.forEach((item) => {
      bulks.push({
        updateOne: {
          filter: {
            id: item.id
          },
          update: item,
          upsert: true
        }
      });
    });

    // save the data
    return this.facade.model.collection.bulkWrite(bulks)
      .then((data) => {
        this.itemsUpdated += bulks.length;
        console.log('saving items');
        this.io.emit('/items/sync', {
          message: `Updated ${this.itemsUpdated}`
        });
      });
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