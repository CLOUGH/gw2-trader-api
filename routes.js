const Router = require('express').Router;
const router = new Router();

const user = require('./model/user/router');
const pet = require('./model/pet/router');
const item = require('./model/item/router');
const itemFilter = require('./model/item-filter/router');

router.route('/').get((req, res) => {
  res.json({
    message: 'Welcome to gw2-trader-api API!'
  });
});

router.use('/user', user);
router.use('/pet', pet);
router.use('/items', item);
router.use('/item-filters', itemFilter);

module.exports = router;