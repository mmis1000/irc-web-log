/* global $, channel, moment, config */

/*$('body').on('click', '.day-name', function (ev) {
    var current = $(ev.target).parent();
    console.log(current)
    if (current.hasClass('fold')) {
       // current.parent().find('.day').addClass('fold');
        current.removeClass('fold');
    } else {
        current.addClass('fold');
        //current.parent().find('.day').addClass('fold');
    }
})*/

var parseColor = function() {

    var colors = [
      "#FFFFFF",
      "#000000",
      "#000080",
      "#008000",

      "#ff0000",
      "#800040",
      "#800080",
      "#ff8040",

      "#ffff00",
      "#80ff00",
      "#008000",
      "#00ffff",

      "#0000ff",
      "#FF55FF",
      "#808080",
      "#C0C0C0"
    ];

    var style = {
      2 : {
        styles : [
          {
            key : "font-weight",
            value : "bold"
          }
        ]
      },
      15: {
        styles : [
          {
            key : "background",
            value : null
          },
          {
            key : "color",
            value : null
          },
          {
            key : "font-style",
            value : null
          },
          {
            key : "text-decoration",
            value : null
          },
          {
            key : "font-weight",
            value : null
          }
        ]
      },
      22: {
        styles:[]
      },
      29: {
        styles : [
          {
            key : "font-style",
            value : "italic"
          }
        ]
      },
      31: {
        styles : [
          {
            key : "text-decoration",
            value : "underline"
          }
        ]
      },
      3 : function(str){
        var temp, color, background,style
        style = [];
        temp = str.substring(1).split(",")
        color = colors[parseInt(temp[0])];
        if (color) {
          style.push({
            key : "color",
            value : color
          })
          if (temp[1]) {
            background = colors[parseInt(temp[1])];
            if (background) {
              style.push({
                key : "background",
                value : background
              })
            }
          }
        } else {
          style.push({
            key : "color",
            value : null
          })
          style.push({
            key : "background",
            value : null
          })
        }

        return {
          styles : style
        };

      }
    }

    function copyOver(from, to) {
      for(var i in from) {
        if(from.hasOwnProperty(i)) {
          to[i] = from[i];
        }
      }
    }

    function wrap(text, styles) {
      var text2;
      var i;
      var isLink = !!styles.url;
      if (text == null) {
        return "";
      }
      for (i in styles) {
        if (styles[i] == null) {
          delete styles[i];
        }
      }
      console.log(styles)
      if (Object.keys(styles).length === 0) return text;
      if (!isLink) {
        text2 = "<span style='"
      } else {
        text2 = "<a href='"
        text2 += styles.url.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        text2 += "' style='"
        delete styles.url;
      }
      for (i in styles) {
        if (styles.hasOwnProperty(i)) {
          text2 += i;
          text2 += ":";
          text2 += styles[i];
          text2 += ";";
        }
      }
      text2 += "'>";
      text2 += text;
      if (!isLink) {
        text2 += "</span>";
      } else {
        text2 += "</a>";
      }
      return text2;
    }

    var parseColor_ = function(html) {

        var html, urlrule, matchrule, matchrule2, allStyle, temp, temp2, text, styles, stylefrag, i, fragTemp;
        allStyle = [2, 15, 22, 29, 31, 3];
        matchrule = /((?:\u0003\d\d?,\d\d?|\u0003\d?\d?|\u0002|\u001d|\u000f|\u0016|\u001f)+)/g;
        urlrule = /((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?)/ig;
        /* use "html" to prevent break links*/
        //html = $(this).html();
        temp = html.split(matchrule);
        temp2 = html.split(urlrule);
        if (temp.length === 1 && temp2.length === 1) {
          /*no color code and link, so break it at early at possible*/
          return html;
        }
        for (i = 0; i < temp.length; i++) {
          text = temp[i];
          if (allStyle.indexOf(text.charCodeAt(0)) < 0) {
            continue;
          }
          styles = {};
          matchrule2 = /((?:\u0003\d\d?,\d\d?|\u0003\d?\d?|\u0002|\u001d|\u000f|\u0016|\u001f))/g;
          fragTemp = matchrule2.exec(text);

          if (!fragTemp) {
            continue;
          }

          stylefrag = [];
          stylefrag.push(fragTemp[1]);
          while (fragTemp = matchrule2.exec(text)) {
            stylefrag.push(fragTemp[1]);
          }

          // extract styles from style frag
          stylefrag.forEach(function(el){
            var temp2, i
            var charCode = el.charCodeAt(0);
            if (style[charCode]) {
              temp2 = style[charCode]
              if (typeof temp2 === "function") {
                temp2 = temp2(el);
              }
              for (i = 0; i< temp2.styles.length; i++) {
                styles[temp2.styles[i].key] = temp2.styles[i].value;
              }
            }
            return true;
          });
          //console.log(JSON.stringify(text));
          //console.log(JSON.stringify(stylefrag));
          //insert styles into list and remove parsed tag
          temp.splice(i, 1, styles);
        }
        
        // start to insert link here
        for (i = temp.length - 1; i >= 0; i--) {
          if ('string' === typeof temp[i]) {
            var regex = /((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?)/ig
            var tempMatchs = temp[i].split(regex);
            tempMatchs = tempMatchs.filter(function (i) {return i !== ''});
            if (tempMatchs.length >= 1) {
              tempMatchs = tempMatchs.map(function (text) {
                if (text.match(regex)) {
                  return [
                    {url: text},
                    text,
                    {url: null}
                  ]
                } else {
                  return [text]
                }
              }).reduce(function (all, curr) {
                return all.concat(curr);
              }, []);
              console.log(tempMatchs)
              ;([]).splice.apply(temp, [i, 1].concat(tempMatchs));
            }
          }
        }
        
        var styleTemp = {};
        for (i = 0; i < temp.length; i++) {
          if (typeof temp[i] === "object") {
            copyOver(temp[i], styleTemp);
            copyOver(styleTemp, temp[i]);
          }
        }
        
        for (i = temp.length - 1; i >= 1; i--) {
          if (typeof temp[i] === 'object' && typeof temp[i - 1] === 'object') {
            temp.splice(i - 1, 1);
          }
        }
        
        for (i = 0; i < temp.length; i++) {
          if (typeof temp[i] === "object") {
            temp.splice(i, 2, wrap(temp[i + 1], temp[i]));
          }
        }

        return temp.join('')

    };

    return parseColor_;
} ();

var getColor = function() {
  var cache = {};
  function getColor_(str) {
    if (cache[str]) {
      return cache[str];
    }

    if (typeof md5 !== "undefined") {
      var frag = parseInt(md5(str.charAt(0)=='ⓢ'? str.substr(2):str).substring(0,6), 16);
    } else {
      var frag = Math.floor(Math.random() * 0xffffff);
      console.log('missing md5 support, using random color now!')
    }

    var h = Math.floor((frag & 0xff0000 >> 16) / 255 * 360);
    var s = Math.floor((frag & 0xff00 >> 8) / 255 * 60 + 20);
    var l = Math.floor((frag & 0xff) / 255 * 20 + 50);

    //convert color with jQuery
    var colorCode = $('<span></span>').css("color", "hsl(" + h + "," + s + "%," + l +"%)").css("color");

    cache[str] = colorCode;
    return colorCode;
  }
  return getColor_;
}();

var dayTemplete = $('.results .day').clone();
var resultTemplete = dayTemplete.find('.result.item').clone();
dayTemplete.find('.result.item').remove();
$('.results .day').remove();

/** @type {Number} */
var currentPage = 0;
/** @type {Object.<Array>} */
var dayCache = {};
/** @type {String | null} */
var text = null;

moment.locale(config.locale);

function addItem(item) {
    var time = new Date(item.time);
    
    var date = 
        moment(time)
        .utcOffset(config.timezone)
        .format('YYYY-MM-DD');
        
    var time = 
        moment(time)
        .utcOffset(config.timezone)
        .format('LT');
        
    var dayItem = dayCache[date] || dayTemplete.clone().appendTo('.results');
    dayItem.find('.day-text').text(date);
    dayCache[date] = dayItem;
    
    var currentCount = +dayItem.find('.count').text();
    dayItem.find('.count').text(currentCount + 1);
    
    var newItem = resultTemplete.clone();
    
    newItem.find('.from').text(item.fromName).css('color', getColor(item.from));
    
    newItem.find('.time').text(time);
    
    if (item.messageFormat === 'html') {
        newItem.find('.message').html(item.messageFormated);
    } else if (item.messageFormat === 'irc') {
        newItem.find('.message').html(parseColor(item.message));
    } else {
        newItem.find('.message').text(item.message);
    }
    
    newItem.find('a').attr('href', '/channel/' + channel + '/' + date + '/#' + item._id)
    
    newItem.appendTo(dayItem)
}

function doSearch() {
    if (!$('.search').val()) return;
    
    text = $('.search').val();
    currentPage = 0;
    $.get('/api/search', {text: text, page: currentPage, channel: channel}, function(res) {
        console.log(res);
        $('.results').empty();
        currentPage = 0;
        dayCache = {};
        $('.result-count-wrapper').removeClass('hidden');
        $('.result-count-wrapper .current-search').text(text);
        $('.result-count-wrapper .result-count').text(res.count);
        
        res.data.forEach(addItem)
        if (res.hasMore) {
            $('.load-more').removeClass('hidden')
        } else {
            $('.load-more').addClass('hidden')
        }
    })

}

$('.submit').click(doSearch)
$('.search').keypress(function (e) {
    if(e.which == 10 || e.which == 13) {
        doSearch()
    }
})

$('.load-more button').click(function () {
    currentPage += 1;
    $.get('/api/search', {text: text, page: currentPage, channel: channel}, function(res) {
        console.log(res);
        res.data.forEach(addItem)
        if (res.hasMore) {
            $('.load-more').removeClass('hidden')
        } else {
            $('.load-more').addClass('hidden')
            
        }
    })
})