/* global $ */
var noWebp = false;
window.noWebp = noWebp;

function enableWebpConvert() {
  $('img[data-mime="image/webp"]').each(function () {
    var src = $(this).attr('data-original');
    src = src.replace(/(\?.*)?$/, '?convert=png&.png');
    $(this).attr('data-original', src);
  })
}
function loadLazy() {
  $(function() {
    $("img.lazy").lazyload({
      threshold : 200,
      effect : "fadeIn"
    });
  });
}
$(document).on('click', function (ev) {
  if ($(ev.target).is('img[data-role=sticker], img[data-role=photo]')) {
    var mediaId = $(ev.target).attr('data-media-id');
    var isPhoto = $(ev.target).is('img[data-role=photo]');
    $.get('/medias/' + mediaId, function (res) {
      var files = res.files
      .filter(function (i) {return !i.isThumb})
      
      if (isPhoto) {
        var windowHeight = $(window).outerHeight()
        var windowWidth = $(window).outerWidth()
        var minIndex = -1;
        files = files.sort(function (a, b) {
          return a.photoSize[0] > b.photoSize[0] ? 1 : -1;
        })
        console.log(files)
        for (var i = 0; i < files.length; i++) {
          if (files[i].photoSize && files[i].photoSize[0] > windowWidth ) {
            if (files[i].photoSize && files[i].photoSize[1] > windowHeight ) {
              minIndex = i;
              break;
            }
          }
        }
        if (minIndex !== -1) {
          files = [files[i]];
        } else {
          files = [files[files.length - 1]];
        }
      }
      var options = files.map(function (i) {
        return {href: '/files/' + i.contentSrc + '?' + ((i.MIME === 'image/webp' && noWebp) ? 'convert=png&' : '') +'.png'}
      })
      console.log(res, options);
      $.fancybox.open(options);
    })
  } else if ($(ev.target).is('img[data-role=video]')) {
    var mediaId = $(ev.target).attr('data-media-id');
    $.get('/medias/' + mediaId, function (res) {
      var videoInfo = res.files.filter(function (file) {
        return file.MIME.match(/^video/);
      })[0]
      var videlEl = $('<video>')
      .attr('poster', $(ev.target).attr('src'))
      .attr('width', videoInfo.photoSize ? videoInfo.photoSize[0] : '')
      .attr('height', videoInfo.photoSize ? videoInfo.photoSize[1] : '')
      .attr('controls', "");
      var sourceEl = $('<source>')
      .attr('type', videoInfo.MIME)
      .attr('src', '/files/' + videoInfo.contentSrc);
      videlEl.append(sourceEl)
      var videoStr = videlEl.appendTo($('<div>')).parent().html();
      
      var options = {
        'content': videoStr
      }
      console.log(res, options);
      $.fancybox.open(options);
    })
  }
})

var hasWebP = (function() {
    // some small (2x1 px) test images for each feature
    var images = {
        basic: "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==",
        lossless: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA="
    };

    return function(feature) {
        var deferred = $.Deferred();

        $("<img>").on("load", function() {
            // the images should have these dimensions
            if(this.width === 2 && this.height === 1) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        }).on("error", function() {
            deferred.reject();
        }).attr("src", images[feature || "basic"]);

        return deferred.promise();
    }
})();

hasWebP().then(function (){
  loadLazy();
}, function (e) {
  window.noWebp = noWebp = true;
  enableWebpConvert();
  loadLazy();
})
/*
$(function() {
  $("img.lazy").lazyload({
    threshold : 200,
    effect : "fadeIn"
  });
});
*/