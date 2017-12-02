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

    const filter = {
      name: {
        $regex: req.query.name || '',
        $options: 'i'
      },
      type: {
        $regex: req.query.type || '',
        $options: 'i'
      },
      rarity: {
        $regex: req.query.rarity || '',
        $options: 'i'
      }
    };
    // Level
    if (req.query.minLevel) {
      filter.level = Object.assign({
        $gte: Number(req.query.minLevel)
      }, filter.level);
    }
    if (req.query.maxLevel) {
      filter.level = Object.assign({
        $lte: Number(req.query.maxLevel)
      }, filter.level);
    }
    // Buy
    if (req.query.minBuy) {
      filter.buy = Object.assign({
        $gte: Number(req.query.minBuy)
      }, filter.buy);
    }
    if (req.query.maxBuy) {
      filter.buy = Object.assign({
        $lte: Number(req.query.maxBuy)
      }, filter.buy);
    }

    // sell
    if (req.query.minSell) {
      filter.sell = Object.assign({
        $gte: Number(req.query.minSell)
      }, filter.sell);
    }
    if (req.query.maxSell) {
      filter.sell = Object.assign({
        $lte: Number(req.query.maxSell)
      }, filter.sell);
    }

    // demand
    if (req.query.minDemand) {
      filter.demand = Object.assign({
        $gte: Number(req.query.minDemand)
      }, filter.demand);
    }
    if (req.query.maxDemand) {
      filter.demand = Object.assign({
        $lte: Number(req.query.maxDemand)
      }, filter.demand);
    }

    // supply
    if (req.query.minSupply) {
      filter.supply = Object.assign({
        $gte: Number(req.query.minSupply)
      }, filter.supply);
    }
    if (req.query.maxSupply) {
      filter.supply = Object.assign({
        $lte: Number(req.query.maxSupply)
      }, filter.supply);
    }

    // profit
    if (req.query.minProfit) {
      filter.profit = Object.assign({
        $gte: Number(req.query.minProfit)
      }, filter.profit);
    }
    if (req.query.maxProfit) {
      filter.profit = Object.assign({
        $lte: Number(req.query.maxProfit)
      }, filter.profit);
    }

    // roi
    if (req.query.minROI) {
      filter.roi = Object.assign({
        $gte: Number(req.query.minROI)
      }, filter.roi);
    }
    if (req.query.maxROI) {
      filter.roi = Object.assign({
        $lte: Number(req.query.maxROI)
      }, filter.roi);
    }

    // buc
    if (req.query.minBUC) {
      filter.buc = Object.assign({
        $gte: Number(req.query.minBUC)
      }, filter.buc);
    }
    if (req.query.maxBUC) {
      filter.buc = Object.assign({
        $lte: Number(req.query.maxBUC)
      }, filter.buc);
    }

    // suc
    if (req.query.minSUC) {
      filter.suc = Object.assign({
        $gte: Number(req.query.minSUC)
      }, filter.suc);
    }
    if (req.query.maxSUC) {
      filter.suc = Object.assign({
        $lte: Number(req.query.maxSUC)
      }, filter.suc);
    }

    console.log(filter);

    return this.facade.model
      .find(filter, {
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
        level: 1,
        buc: 1,
        suc: 1
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

    // get items
    axios.get(`${this.gw2ApiUrl}/commerce/listings`).then((response) => {
      const ids = response.data;
      this.numberOfIds = ids.length;

      this.io = req.io;

      this.io.emit('/items/sync', {
        message: `Got ${this.numberOfIds} items`,
        running: true
      });

      this.downloaded = 0;
      this.itemsUpdated = 0;

      const idChunks = ItemController.chunk(response.data, this.itemsPerRequest);
      const queue = new TaskQueue(Promise, this.MAX_SIMULTANEOUS_DOWNLOADS);

      req.io.emit('/items/sync', {
        message: 'Building urls',
        running: true
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

              item.buc = 0;
              item.suc = 0;

              for (const buy of listings.buys) {
                if (!this.profitable(buy.unit_price, item.sell)) {
                  break;
                }
                item.buc += 1;
              }

              for (const sell of listings.sells) {
                if (!this.profitable(item.buy, sell.unit_price)) {
                  break;
                }
                item.suc += 1;
              }

              item.listings = listings;
            });
            return this.saveItems(values[0]);
          });
        }))
        .then((data) => {
          req.io.emit('/items/sync', {
            message: 'Done',
            running: false
          });
        });
    }).catch(err => next(err));


    // save exit after all the promises have been resolved

    return res.json([]);
  }

  profitable(buy, sell) {
    return ((sell - sell * 0.15) - buy) > 0;
  }
  getListings(ids) {
    return axios.get(`${this.gw2ApiUrl}/commerce/listings?ids=${ids}`)
      .then((response) => {
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
          message: `Downloaded ${this.downloaded} items of ${this.numberOfIds}`,
          running: true
        });

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
        this.io.emit('/items/sync', {
          message: `Updated ${this.itemsUpdated}`,
          running: true
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