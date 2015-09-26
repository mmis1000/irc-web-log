//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');
var mongoose = require('mongoose');

var moment = require('moment');
var mubsub = require('mubsub');

var config = require('./config')
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.locals.moment = moment;
router.locals.globalConfig = config;
router.locals.escapeHTML = require("./lib/escape_html.js");
router.locals.parseColor = require("./lib/parse_irc_color.js");
router.locals.getColor = require("./lib/get_color.js");

mongoose.connect(config.dbpath);

var db = mongoose.connection;
db.on('error', onDbConnect.bind(null));
db.once('open', onDbConnect.bind(null, null));

var Message = null;
//console.log(config.dbpath, config.collectionName + 'Trigger');
var MessageChannel = mubsub(config.dbpath).channel(config.collectionName + 'Trigger');
MessageChannel.subscribe('update', function(message) {
    //console.log('channel test', message);
    io.emit('update', message);
});

function onDbConnect(err, cb) {
  if (err) {
    throw err;
  }
  
  var MessageSchema = mongoose.Schema({
    from : String,
    to : String,
    message : String,
    isOnChannel : Boolean,
    time : { type : Date, index : true }
  }, { collection : config.collectionName });
      
      
  Message =  mongoose.model('Message', MessageSchema);

  //init server after db connection finished
  server.listen(config.port || 8080, config.ip || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Chat server listening at", addr.address + ":" + addr.port);
  });
}

router.set('views', path.resolve(__dirname, 'views'));
router.set('view engine', 'ejs');
router.get('/message/:id/', function(req, res, next) {

  var id = mongoose.Types.ObjectId(req.params.id);
  var query = {
    _id : id
  };
  Message.find(query,function (err, message) {
    if (err) {
      res.end(err.toString());
      return;
    }
    if (message.length === 0) {
      res.end('not found');
      return;
    }
    
    // cache it, it is actully perminent link
    var maxAge = 86400 * 1000;
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
    res.render('message', {message : message[0]});
  })
})
router.get('/channel/:channel/:date/', function (req, res, next) {
  if (!req.params.date.match(/^\d\d\d\d-\d\d-\d\d$/) && req.params.date !== 'today') {
    res.end('unknown date: ' + req.params.date);
    return;
  }
  var isToday = false;
  var start = req.params.date
  if (start === 'today') {
    start = moment().utcOffset(config.timezone).startOf('day').toDate();
    isToday = true;
  } else {
    start = moment(start + ' ' + config.timezone, 'YYYY-MM-DD Z').toDate();
    if (isNaN( start.getTime()) ){
      res.end('unknown date: ' + req.params.date);
      return;
    }
    if (moment(start).add(1, 'days').isAfter(new Date())) {
      res.redirect('/channel/' + req.params.channel + '/today');
      return;
    }
  }
  var query = {};
  var channel = '#' + req.params.channel
  query.to = channel;
  query.time = {
    $gte : start,
    $lt : moment(start).utcOffset(config.timezone).endOf('day').toDate()
  }
  
  Message.find(query)
  .sort({ 'time' : 1})
  .exec(function (err, messages) {
    if (err) {
      res.end(err.toString());
      return;
    }
    if (isToday) {
      // don't cache live channel
      res.header('Cache-Control', 'no-cache, must-revalidate');
    } else {
      // cache it, it is actully perminent link
      var maxAge = 86400 * 1000;
      if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
    }
    res.render('channel', {
      messages : messages, 
      channel : channel, 
      isToday : isToday,
      selectedDay : req.params.date,
      query : req.query
    });
  })

})

router.get('/api/dump/', function (req, res, next) {
  
  Message.find({})
  .sort({ 'time' : 1})
  .exec(function (err, messages) {
    if (err) {
      res.json({ _error : err.toString() });
      return;
    }
    res.json(messages);
  });
});

router.get('/', function (req, res, next) {
  res.render('index', {});
});

router.use(express.static(path.resolve(__dirname, 'public')));
