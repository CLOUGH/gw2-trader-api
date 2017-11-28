const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const bluebird = require('bluebird');
const cors = require('cors');
let io = require('socket.io');
const http = require('http');

const config = require('./config');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

mongoose.Promise = bluebird;
mongoose.connect(config.mongo.url, {
  useMongoClient: true
});

io = io(server);

app.use(cors());
app.use(helmet());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(morgan('tiny'));

// adding socket io through the middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('connected');

  io.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use('/', routes);

server.listen(config.server.port, () => {
  console.log(`Magic happens on port ${config.server.port}`);
});

module.exports = server;