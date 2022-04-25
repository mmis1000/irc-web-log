require('coffee-script/register')

var http = require('http');
var path = require('path');
var fs = require("fs");

var basicAuth = require('basic-auth-connect');
var bodyParser = require('body-parser')
var range = require('express-range');
var socketio = require('socket.io');
var mubsubAdapter = require('socket.io-adapter-mongo');
var express = require('express');
var Q = require('q');
var mongoose = require('mongoose');
    mongoose.Promise = Q .Promise;
    
var LRU = require("lru-cache"),
    messageCache = LRU(100);
var deepPopulate = require('mongoose-deep-populate')(mongoose);
var parseRange = require('range-parser');

var moment = require('moment');
var mubsub = require('mubsub');
var convert = require('./convert');
var mime = require('mime');

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

var MessageChannel = mubsub(config.dbpath).channel(config.collectionName + 'Trigger');

router.use(range({
  accept: 'bytes',
  limit: 10,
}));
router.use(bodyParser.urlencoded({ extended: false }));

router.locals.moment = moment;
router.locals.globalConfig = config;
router.locals.escapeHTML = require("./lib/escape_html.js");
router.locals.parseColor = require("./lib/parse_irc_color.js");
router.locals.getColor = require("./lib/get_color.js");
var getUserInfo = router.locals.getUserInfo = (function () {
  var userCache = LRU({ max: 500, maxAge: 1000 * 60 * 60 * 2 });
  
  MessageChannel.subscribe('user-update', function(data) {
    var user = data.data;
    
    userCache.del(user._id);
    user.ids.forEach(function (id) {
      userCache.del(id);
    })
  });
  
  return function getUser(id) {
    var resultPromise = userCache.get(id);
    
    if (resultPromise !== undefined) {
      return resultPromise;
    }
    
    resultPromise = User.findOne({
      _id: id
    })
    .deepPopulate('images images.files')
    .exec()
    .then(function (user) {
      if (user) {
        return user;
      }
      
      return User.findOne({
        ids: id
      })
      .deepPopulate('images images.files')
      .exec();
    })
    .then(function (user) {
      return user;
    });
    
    userCache.set(id, resultPromise);
    
    return resultPromise;
  };
} ());

mongoose.connect(config.dbpath, config['mongoose-options'] || {});

var db = mongoose.connection;
db.on('error', onDbConnect.bind(null));
db.once('open', onDbConnect.bind(null, null));

var escapeRegExp = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}
/**
 * @type {import('mongoose').Model}
 */
var Message = null;
/**
 * @type {import('mongoose').Model}
 */
var Media = null;
/**
 * @type {import('mongoose').Model}
 */
var File = null;
/**
 * @type {import('mongoose').Model}
 */
var User = null;
var gfs = null;
var ejsStream = require("ejs-promise");

MessageChannel.subscribe('update', function(message) {
    Message.findOne({
      _id: message.data._id
    }).deepPopulate('medias medias.files')
    .then(function (message) {
      var userPromise = getUserInfo(message.from);
      var targetPromise = getUserInfo(message.to);
      return Q.all([Promise.resolve(message), userPromise, targetPromise]);
    })
    .then(function ($) {
      var message = $[0], userInfo = $[1], targetInfo = $[2];
      
      var prepandLength, 
          prepend, 
          name = userInfo ? userInfo.getFullName() : message.from,
          target = targetInfo ? targetInfo.getFullName() : message.to.replace(/^#/, '');

      if (message.to.match(/^#/)) {
        prepandLength = 
          target.length +
          name.length +
          7;
        prepend = " ".repeat(prepandLength);
        console.log(
          '[ ' + target + ' ] ' + 
          (name + ': ' + message.message).replace(/\n/g, '\n' + prepend));
      } else {
        prepandLength = 
          target.length +
          name.length +
          9;
        prepend = " ".repeat(prepandLength);
        console.log(
          '[-> ' + target + ' ] ' + 
          (name + ': ' + message.message).replace(/\n/g, '\n' + prepend)
        ); 
      }
      io.emit('update', { data: message, userInfo: userInfo });
      if (sockets[message.to]) {
        sockets[message.to].forEach(function (res) {
          res.write(name + ': ' + message.message + '\r\n');
        })
      }
    })
    .catch(function (err) {
      console.error(err.stack || err.toString());
    })
});

io.adapter(mubsubAdapter(config.dbpath));

function onDbConnect(err, cb) {
  if (err) {
    // Handle error gracefully
    // throw err;
    console.log('Error occured!', err);
    // Attempt reconnect
    // mongoose.connect(config.dbpath, {});
    return;
  }
  
  var FileSchema = require("./log_modules/file_schema_factory")(mongoose, 'Files')
  File =  mongoose.model('File', FileSchema)
  var MediaSchema = require("./log_modules/media_schema_factory")(mongoose, 'File', 'Medias')
  MediaSchema.plugin(deepPopulate);
  Media =  mongoose.model('Media', MediaSchema)
  var MessageSchema = require("./log_modules/message_schema_factory")(mongoose, 'Media', 'Messages')
  MessageSchema.plugin(deepPopulate);
  Message =  mongoose.model('Message', MessageSchema)
  var UserSchema = require("./log_modules/user_schema_factory")(mongoose, 'Media', 'Users')
  UserSchema.plugin(deepPopulate);
  User =  mongoose.model('User', UserSchema)
  
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'FileContent'
  })
  //init server after db connection finished
  server.listen(config.port || 8080, config.ip || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Chat server listening at", addr.address + ":" + addr.port);
  });
}

/* [start] inject some opt to ejs */
;(function () {
  var old__express = ejsStream.__express;
  ejsStream.__express = function (path, data, cb) {
    return old__express.call(this, path, data, config["ejs-options"] || {}, cb);
  }
} ());
/* [ end ] inject some opt to ejs  */

router.set('views', path.resolve(__dirname, 'views'));
router.set('view engine', 'ejs');
router.engine('ejs', ejsStream.__express);

if (config["minify-html"]) {
  var minifyHTML = require('express-minify-html');
  router.use(minifyHTML({
    override:      true,
    htmlMinifier: {
      removeComments:            true,
      collapseWhitespace:        true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes:     true,
      removeEmptyAttributes:     true,
      minifyJS:                  false
    }
}));
}

// pages
router.get('/message/:id/', function(req, res, next) {
  // set moment locale here for performence
  try {
    moment.locale(req.query.locale || config.locale);
  } catch (e) {
    console.error(e.stack || e.message || e.toString());
  }

  var id = mongoose.Types.ObjectId(req.params.id);
  var query = {
    _id : id
  };
  Message
  .findOne(query)
  .deepPopulate('medias medias.files')
  .exec()
  .then(function (message) {
    if (!message) {
      res.status(404).end('not found');
      return;
    }
    
    var maxAge = 86400 * 1000;
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
    res.render('message.ejs', {message : message});
  })
  .catch(function (err) {
    res.status(500).end(err.stack ? err.stack : err.toString());
  })
})
router.get('/channel/:channel/:date/', function (req, res, next) {
  // set moment locale here for performence
  try {
    moment.locale(req.query.locale || config.locale);
  } catch (e) {
    console.error(e.stack || e.message || e.toString());
  }
  
  if (!req.params.date.match(/^\d\d\d\d-\d\d-\d\d$/) && req.params.date !== 'today') {
    res.status(404).end('unknown date: ' + req.params.date);
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
      res.status(404).end('unknown date: ' + req.params.date);
      return;
    }
    if (moment(start).add(1, 'days').isAfter(new Date())) {
      res.redirect('/channel/' + encodeURIComponent(req.params.channel) + '/today');
      return;
    }
  }
  var cacheName = start.toISOString() + '_' + req.params.channel
  if (isToday || !config["page-cache"]) {
    renderPage(req, res, start, isToday);
  } else {
    checkOrWritePage(cacheName, function (err, filename) {
      if (!err) {
        console.log('serve from cache')
        res.sendFile(filename)
        return
      }
      renderPage(req, res, start, isToday, function (err, res) {
        if (err) return;
        checkOrWritePage(cacheName, res, function (err, res) {
          if (err) console.error(err.stack);
        })
      })
    })
  }
})

function renderPage(req, res, start, isToday, cb) {
  cb = cb || function () {};
  var query = {};
  var channel = '#' + req.params.channel
  query.to = channel;
  query.time = {
    $gte : start,
    $lt : moment(start).utcOffset(config.timezone).endOf('day').toDate()
  }
  
  res.header('content-type', 'text/html')
  if (isToday) {
    // don't cache live channel
    res.header('Cache-Control', 'no-cache, must-revalidate');
  } else {
    // cache it, it is actully perminent link
    var maxAge = 86400 * 1000;
    if (!res.getHeader('Cache-Control')) res.header('Cache-Control', 'public, max-age=' + (maxAge / 1000));
    res.header('etag', req.params.date + '-' + ~~(Date.now() / 6 / 3600 / 1000));
    if (req.get('If-None-Match') === req.params.date + '-' + ~~(Date.now() / 6 / 3600 / 1000)) {
      // return it, don't validate here, since we don't care
      return res.status(304).end('no change')
    }
  }
  
  var first100Message = Message.find(query)
    .sort({ 'time' : 1})
    .deepPopulate('medias medias.files')
    .limit(100)
    .exec()
  
  var datas = Object.create(router.locals);
  datas.channel = channel; 
  datas.isToday = isToday;
  datas.selectedDay = req.params.date;
  datas.query = req.query;
  datas.debug = false;
  
  var cacheKeyPrefix = JSON.stringify(query);
  var messageChunk = null;
  
  var countWait = Message.find(query).count().then(function (counts) {
    console.log('all ' + counts);
    for (var i = 1; i < counts / 100; i++) {
      if (i < counts / 100 - 1) {
        messageChunk = messageCache.get(cacheKeyPrefix + i);
        if (!messageChunk) {
          messageChunk = 
            Message.find(query)
            .sort({ 'time' : 1})
            .deepPopulate('medias medias.files')
            .skip(i * 100)
            .limit(100)
            .exec()
          messageCache.set(cacheKeyPrefix + i, messageChunk)
        } else {
          console.log('cache Hit')
        }
      } else {
        messageChunk = 
          Message.find(query)
          .sort({ 'time' : 1})
          .deepPopulate('medias medias.files')
          .skip(i * 100)
          .limit(100)
          .exec()
      }
      datas.messages.push(messageChunk)
    }
    return [];
  })
  datas.messages = [first100Message, countWait];
  // datas.debug = true;
  ejsStream.renderFile('./views/channel.ejs', datas, {rmWhitespace: true}, function (err, p) {
    if (err) {
      return res.status(500).end(err.toString());
    }
    p.outputStream.pipe(res);
    p.then(function (res) {
      cb(null, res);
    }, function (err) {
      p.outputStream.unpipe(res);
      res.end(err.message || err.stack || err.toString());
      cb(err);
      console.log(err);
    })
    
    req.once('end', function () {
      console.log('request ended')
      // kill it, if it isn't already
      setTimeout(function () {
        try {
          res.end(null);
        } catch (e) {}
      }, 10)
      p.defered.interrupt();
    })
    
  })
}
function checkOrWritePage(name, content, cb) {
  var filename = path.resolve('./cache-page', name + '.html')
  if (arguments.length === 2) {
    // check
    cb = content;
    fs.stat(filename, function (err, stat) {
      if (err) return cb(err)
      cb(null, filename)
    })
  } else {
    //writefile
    fs.writeFile(filename, content, function (err, stat) {
      if (err) return cb(err)
      cb(null, filename)
    })
  }
  
}

router.get('/channel-raw/:channel/:date', function (req, res, next) {
  // set moment locale here for performence
  try {
    moment.locale(req.query.locale || config.locale);
  } catch (e) {
    console.error(e.stack || e.message || e.toString());
  }
  
  if (!req.params.date.match(/^\d\d\d\d-\d\d-\d\d$/) && req.params.date !== 'today') {
    res.status(404).end('unknown date: ' + req.params.date);
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
      res.status(404).end('unknown date: ' + req.params.date);
      return;
    }
    if (moment(start).add(1, 'days').isAfter(new Date())) {
      res.redirect('/channel/' + encodeURIComponent(req.params.channel) + '/today');
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

  res.header('Content-Type', 'text/plain; charset=utf-8');

  res.write('-- ' + channel + ' - ' + moment(start).utcOffset(config.timezone).format('YYYY-MM-DD Z') + ' --\n')

  var ended = false
  Message.find(query)
    .sort({ 'time' : 1})
    .stream()
    .on('data', function (doc) {
      res.write(moment(doc.time).utcOffset(config.timezone).format('HH:mm:ss') + ' <' + doc.from + '> ' + doc.message + '\n')
      // do something with the mongoose document
    })
    .on('error', function (err) {
      if (ended) return;
      ended = true;
      res.status(500).end(err.stack ? err.stack : err.toString());
      // handle the error
    }).on('close', function () {
      if (ended) return;
      ended = true;
      res.end();
      // the stream is closed
    });
    
  req.on("close", function() {
    console.log('connection aborted')
  });
})

router.get('/files/:id', function (req, res, next) {
  
  var promise = File.findOne({
    _id: req.params.id
  }).exec()
  promise.then(function (doc) {
    if (doc) {
      res.set('Content-Type', doc.MIME);
      res.set('Content-Length', doc.length);
      var range = req.headers.range ? parseRange(doc.length, req.headers.range) : null;
      if (range === null){
        var readstream = gfs.openDownloadStreamByName(doc.contentSrc, {});
      } else if (range !== -1 && range.type === 'bytes' && range.length === 1) {
        res.set('Content-Length', range[0].end - range[0].start + 1);
        var temp = {};
        if (range[0].start !== 0) {
          temp.startPos = range[0].start;
        }
        if (range[0].end !== doc.length + 1) {
          temp.endPos = range[0].end + 1;
        }
    		res.range({
    			first: range[0].start,
    			last: range[0].end,
    			length: doc.length
    		});
        var readstream = gfs.openDownloadStreamByName(doc.contentSrc, {
          start: temp.startPos,
          end: temp.endPos
        });
        res.status(206);
      } else {
        res.set('Content-Type', 'text/html');
        res.set('Content-Length', '');
        return res.status(416).end('range not satisfied');
      }
      readstream.on('error', function (err) {
        res.set('Content-Type', 'text/plain');
        res.set('Content-Length', '');
        res.status(500).end(err.stack? err.stack: err.toString());
      })
      if (req.query.convert) {
        convert(readstream, req.params.id, req.query.convert)
        .then(function (path) {
          res.set('Content-Length', '');
          res.set('Content-Type', mime.lookup(path))
          res.sendFile(path)
        })
        .catch(function (err) {
          res.set('Content-Type', 'text/plain');
          res.set('Content-Length', '');
          console.error(err.stack? err.stack: err.toString());
          res.status(500).end(err.stack? err.stack: err.toString());
        })
      } else {
        readstream.pipe(res);
      }
    } else {
      res.status(404).end('file not found');
    }
  }).catch(function (err) {
    res.set('Content-Type', 'text/plain');
    res.set('Content-Length', '');
    console.error(err.stack? err.stack: err.toString());
    res.status(500).end(err.stack? err.stack: err.toString());
  })
})

// api for media info
router.get('/medias/:id', function (req, res, next) {
  Media.findOne({
    _id: req.params.id
  })
  .deepPopulate('files')
  .exec()
  .then(function (doc) {
      if (!doc) return res.status(404).json({error: 'file not found'});
      res.json(doc);
  })
  .catch(function (err) {
    res.status(500).end(err.stack? err.stack: err.toString());
  })
})

// api to dump whole db
router.get('/api/dump/', function (req, res, next) {
  var isStart = true;
  var ended = false;
  var stream = Message.find({})
  .sort({ 'time' : 1})
  .stream()
  .on('data', function (doc) {
    if (ended) return;
    if (isStart) {
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.write('[');
      res.write(JSON.stringify(doc));
      isStart = false;
    } else {
      res.write(',');
      res.write(JSON.stringify(doc));
    }
    // do something with the mongoose document
  })
  .on('error', function (err) {
    if (ended) return;
    ended = true;
    res.status(500).end(err.stack ? err.stack : err.toString());
    // handle the error
  }).on('close', function () {
    if (ended) return;
    ended = true;
    res.end(']');
    // the stream is closed
  });
  
  req.on("close", function() {
    console.log('connection aborted')
    try {
      stream.destroy()
    } catch (err) {
      console.error(err)
    }
  });
  
  req.on("end", function() {
    try {
      stream.destroy()
    } catch (err) {
      console.error(err)
    }
  });
});

// punch card for user
router.get('/api/punch/user/:name', function(req, res, next) {
  var name = '' + req.params.name;
  var temp =  /([+-])(\d+):(\d+)/.exec(config.timezone)
  var zoneHour = temp[1] + temp[2] - 0
  var zoneMinute = temp[1] + temp[3] - 0
  
  var offset = (zoneHour + zoneMinute / 60) * 3600 * 1000;
  
  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
  
  Message
  .mapReduce({
    query: {
      from: {$regex: '^' + escapeRegExp(name) + '$', $options: 'i'},
      time: {$gt: new Date(Date.now() - 86400 * 1000 * 7 * 8)}
    },
    out: { inline: 1 },
    map: function () {
      /* global emit, offset */
      var time = this.time - 0;
      var weekHour = ~~((time + 4 * 86400 * 1000 + offset) / 3600 / 1000 % (7 * 24));
      emit(weekHour, {
        total: 1, 
        value: [{
          time: this.time, 
          to: this.to,
          message: this.message, 
          id: this._id
        }]
      });
    },
    reduce: function (key, values) {
      var i = 0, newRes = {total: 0, value: []};
      for (i = 0; i < values.length; i++) {
        newRes.total += values[i].total;
        newRes.value = [].concat.apply(newRes.value, values[i].value);
      }
      return newRes;
    },
    scope: {
      offset: offset
    }
  })
  .then(function (results) {
    res.json(results);
  })
  .catch(function (err) {
    res.status(500).json({
      error: err.message || err.stack || err.toString()
    })
  })
})
router.get('/punch/user/:name', function (req, res, next) {
  var temp =  /([+-])(\d+):(\d+)/.exec(config.timezone)
  var zoneHour = temp[1] + temp[2] - 0
  var zoneMinute = temp[1] + temp[3] - 0
  
  var offset = (zoneHour + zoneMinute / 60) * 3600 * 1000;
  try {
    moment.locale(req.query.locale || config.locale);
  } catch (e) {
    console.error(e.stack || e.message || e.toString());
  }
  res.render('punch_card',{
    name: req.params.name,
    offset: offset
  })
})

// punchcard for channel
router.get('/api/punch/channel/:channel', function(req, res, next) {
  var channel = '' + req.params.channel;
  var temp =  /([+-])(\d+):(\d+)/.exec(config.timezone)
  var zoneHour = temp[1] + temp[2] - 0
  var zoneMinute = temp[1] + temp[3] - 0
  
  var offset = (zoneHour + zoneMinute / 60) * 3600 * 1000;
  
  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
  
  console.log('regex is ' + '^#' + escapeRegExp(channel) + '$')
  
  Message
  .mapReduce({
    query: {
      to: {$regex: '^#' + escapeRegExp(channel) + '$', $options: 'i'},
      time: {$gt: new Date(Date.now() - 86400 * 1000 * 7 * 4)}
    },
    out: { inline: 1 },
    map: function () {
      /* global emit, offset */
      var time = this.time - 0;
      var weekHour = ~~((time + 4 * 86400 * 1000 + offset) / 3600 / 1000 % (7 * 24));
      emit(weekHour, 1);
    },
    reduce: function (key, values) {
      return Array.sum( values );
    },
    scope: {
      offset: offset
    }
  })
  .then(function (results) {
    res.json(results);
  })
  .catch(function (err) {
    res.status(500).json({
      error: err.message || err.stack || err.toString()
    })
  })
})
router.get('/punch/channel/:channel', function (req, res, next) {
  try {
    moment.locale(req.query.locale || config.locale);
  } catch (e) {
    console.error(e.stack || e.message || e.toString());
  }
  res.render('punch_card_channel',{
    channel: req.params.channel
  })
})

// channel list
router.get('/channel_list', function (req, res, next) {
  moment.locale(req.query.locale || config.locale);
  
  var data = {
    getMessageDate: function (message) {
      return moment(message.time)
      .utcOffset(config.timezone)
      .format('YYYY-MM-DD');
    },
    getTimeHumanReadable: function (message) {
      return moment(message.time)
      .utcOffset(config.timezone)
      .fromNow();
    },
    channelPromises: function () {
      return User
      .find({type: 'channel'})
      .deepPopulate('images images.files')
      .then(function (channels) {
        return Q.all(channels.map(function (channel) {
          return Message
          .find({to: channel._id})
          .sort({time: -1})
          .limit(1)
          .then(function(message) {
            channel.lastMessage = message[0];
            return channel;
          })
        }))
      })
      .then(function (channels) {
        return channels
        .filter(function (channel) {
          return !!channel.lastMessage;
        })
        .sort(function(channel0, channel1) {
          return channel0.lastMessage.time.getTime() > channel1.lastMessage.time.getTime() ? -1 : 1;
        })
      })
    } ()
  }
  
  ejsStream.renderFile('./views/channel_list.ejs', data, {rmWhitespace: true}, function (err, p) {
    if (err) {
      return res.status(500).end(err.toString());
    }
    p.outputStream.pipe(res);
    p.catch(function (err) {
      p.outputStream.unpipe(res);
      res.end(err.message || err.stack || err.toString());
      console.log(err);
    })
    
    req.once('end', function () {
      console.log('request ended')
      // kill it, if it isn't already
      setTimeout(function () {
        try {
          res.end(null);
        } catch (e) {}
      }, 10)
      p.defered.interrupt();
    })
    
  })
})


var sockets = {};
// curl live interface
router.get('/curl/:channel/', function (req, res, next) {
  var channel = '#' + req.params.channel;
  if (!sockets[channel]) {
    sockets[channel] = [];
  }
  var items
  sockets[channel].push(res)
  res.write('---------------------------------------------\r\n' +
            '||       welcome to the irc-web-log        ||\r\n' +
            '|| https://github.com/mmis1000/irc-web-log ||\r\n' +
            '---------------------------------------------\r\n' +
            '* Now tailing log for ' + channel + '\r\n');
  req.on('close', function () {
    if (sockets[channel]) {
      sockets[channel].splice(sockets[channel].indexOf(res), 1);
      if (sockets[channel].length === 0) {
        delete sockets[channel];
      }
    }
  })
});
// index page
router.get('/', function (req, res, next) {
  res.render('index.ejs', {});
});

// api for delete message
router.post('/api/admin/delete', basicAuth(config['db-manager-account'], config['db-manager-password']), function (req, res, next) {
  Message.findById(req.body.id)
  .exec()
  .then(function (doc) {
    if (!doc) {
      return res.status(404).json({error: 'file not found'})
    }
    return doc.remove()
  })
  .then(function () {
    res.json({done: true})
  })
  .catch(function (err) {
    return res.status(500).json({error: err.stack || err.toString()})
  })
})
router.post('/api/admin/delete-with-media', basicAuth(config['db-manager-account'], config['db-manager-password']), function (req, res, next) {
  var docToRemoves = [];
  Message.findById(req.body.id)
  .exec()
  .then(function (doc) {
    if (!doc) {
      return res.status(404).json({error: 'file not found'})
    }
    docToRemoves.push(doc)
    return doc;
  })
  .then(function (doc) {
    return Q.all(doc.medias.map(function (id) {
      return Media.findById(id).exec();
    }))
  })
  .then(function (medias) {
    docToRemoves = docToRemoves.concat(medias);
    
    var fileQuerys = medias.map(function (media) {
      return media.files.map(function (id) {
        return File.findById(id).exec();
      })
    })
    fileQuerys = [].concat.apply([], fileQuerys)
    return Q.all(fileQuerys);
  })
  .then(function (files) {
    docToRemoves = docToRemoves.concat(files);
    
    var docToRemovePromise = docToRemoves.map(function (doc) {
      return doc.remove();
    })
    console.log('total model remove: ' + docToRemovePromise.length);
    
    var fileToRemovePromise = files
    .filter(function (file) {
      return file.contentSource === 'db';
    })
    .map(function (file) {
      return gfs.remove({filename: file.contentSrc})
    })
    console.log('total file remove: ' + fileToRemovePromise.length);
    return Q.all(docToRemovePromise.concat(fileToRemovePromise));
  })
  .then(function () {
    res.json({done: true})
  })
  .catch(function (err) {
    return res.status(500).json({error: err.stack || err.toString()})
  });
})

router.get('/api/medias/:type/:page', function(req, res, next) {
  var pageSize = 30;
  
  if (!req.params.page.match(/^([1-9][0-9]*|0)$/)) {
    return res.status(400).end('bad page number')
  }
  
  var page = Number(req.params.page);
  
  if (req.query.pagesize) {
    if (!req.query.pagesize.match(/^([1-9][0-9]*|0)$/)) {
      return res.status(400).end('bad page size')
    }
    pageSize = Number(req.query.pagesize);
  }
  Media
  .find({role: req.params.type})
  .sort({time: -1})
  .populate('files')
  .skip(page * pageSize)
  .limit(pageSize)
  .lean()
  .then(function (result) {
    res.json(result);
  })
  .catch(function (err) {
    res.status(500).json(err);
  })
})

router.get('/photo-wall/:page', function (req, res, next) {
  if (!req.params.page.match(/^[1-9][0-9]*$/)) {
    return next();
  }
  res.render('photo_wall',{
    page: req.params.page - 1
  })
})

router.get('/api/search', function(req, res, next) {
  var query = '' + req.query.text;
  var channel = '' + req.query.channel;
  var asRegex = req.query.regex === 'true';
  var pageSize = 100;
  
  if ('string' !== typeof req.query.page || !req.query.page.match(/^0|[1-9][0-9]*$/)) {
    return res.status(400).json({
      ok: false,
      err: 'bad page number'
    })
  }
  
  var page = Number(req.query.page);
  
  var regex;
  
  if (!asRegex) {
    query = escapeRegExp(query);
  }
  
  regex = new RegExp(query, 'i')
  
  var query = {
    message: {$regex: regex},
    to: '#' + channel
  }
  
  var count;
  
  Message.count(query)
  .then(function (c) {
    count = c;
    return Message.find(query)
    .sort({time: -1})
    .skip(pageSize * page)
    .limit(pageSize)
  })
  .then(function (result) {
    return Q.all(
      result
      .map(function(item) {
        return item.toObject();
      })
      .map(function (item) {
        return getUserInfo(item.from)
        .then(function (user) {
          item.fromName = user ? user.getFullName() : item.from;
          return item;
        })
      })
    )
  })
  .then(function (result) {
    var hasMore = (page + 1) * pageSize < count;
    res.json({
      hasMore: hasMore,
      count: count,
      ok: true,
      data: result
    });
  })
  .catch(function (err) {
    console.log(err.stack);
    res.status(500).json({
      ok: false,
      err: err.message || err.stack || err.toString
    })
  })
})

router.get('/search/:channel', function (req, res, next) {
  res.render('search', {channel: req.params.channel})
})

var mongo_express = require('mongo-express/lib/middleware');
var mongo_express_config = require('./mongo_express_config');

(function (mongo_express_config) {
   mongo_express_config.mongodb.connectionString = config.dbpath;
   mongo_express_config.options.gridFSEnabled = true;
   mongo_express_config.basicAuth.username = config["db-manager-account"];
   mongo_express_config.basicAuth.password = config["db-manager-password"];
   
} (mongo_express_config));

async function finalize () {
  if (config["enable-db-manager"]) {
    router.use(config["db-manager-path"], await mongo_express(mongo_express_config))
  }
  
  router.use(express.static(path.resolve(__dirname, 'public')));  
}

finalize()
