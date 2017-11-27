const config = {
  environment: process.env.NODE_ENV || 'dev',
  server: {
    port: process.env.PORT || 3000
  },
  mongo: {
    url: process.env.MONGO_DB_URI || 'mongodb://localhost/gw2-trader-api'
  }
};

module.exports = config;