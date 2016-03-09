var Q = require('q');
var temp = require('temp');
var path = require('path');
var fs = require('fs');

var ffmpegBin = require('ffmpeg-static').path;
var ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegBin) 

var targetDir = path.resolve(__dirname, 'cache')

temp.track();

function createTempDir (dirName) {
  var defered = Q.defer();
  temp.mkdir('ffmpegTemp', function(err, dirPath) {
    if (err) return defered.reject(err);
    defered.resolve(dirPath)
  })
  return defered.promise;
}

function isFileExist(path) {
  var defered = Q.defer();
  fs.stat(path, function (err, stat) {
    if (err) return defered.resolve(false);
    defered.resolve(true);
  })
  return defered.promise
}

function convert(stream, id, toExt) {

  var targetFileName = path.resolve(targetDir, id + '.' + toExt);
  
  var defered = Q.defer();
  if (0 > ['png', 'jpg', 'jpeg', 'gif'].indexOf(toExt)) {
    defered.reject(new Error('not allowed extension'));
    return defered.promise;
  }
  isFileExist(targetFileName)
  .then(function (exist) {
    if (exist) throw defered.resolve(targetFileName);
    return createTempDir('ffmpeg_temp');
  })
  .then(function (dirPath) {
    var defered = Q.defer();
    var tempfileName = path.resolve(dirPath, 'file');
    var tempDirStream = fs.createWriteStream(tempfileName);
    stream.pipe(tempDirStream);
    var called = false;
    stream.on('error', function (err) {
      if (called) return;
      called = true;
      defered.reject(tempfileName)
    })
    stream.on('close', function () {
      if (called) return;
      called = true;
      defered.resolve(tempfileName)
    })
    return defered.promise;
  })
  .then(function (tempFileName) {
    var defered = Q.defer();
    var called = false;
    ffmpeg(tempFileName)
    .on('error', function(err) {
      if (called) return;
      called = true;
      defered.reject(err);
    })
    .on('end', function() {
      if (called) return;
      called = true;
      defered.resolve(targetFileName);
    })
    .save(targetFileName);
    return defered.promise;
  })
  .then(function (targetFileName) {
    defered.resolve(targetFileName)
  })
  .catch(function (err) {
    defered.reject(err);
  })
  return defered.promise;
}

module.exports = convert;