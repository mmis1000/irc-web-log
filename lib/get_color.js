/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function pad(str) {
  var pad = "000000";
  var ans = pad.substring(0, pad.length - str.length) + str;
  return ans;
}

function hslToColor(h, s, l) {
  var rgb = hslToRgb(h, s, l);
  var temp = rgb[0] * 0x10000 + rgb[1] * 0x100 + rgb[2];
  temp = temp.toString(16);
  temp = "#" + pad(temp);
  return temp;
}

var crypto = require('crypto');
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}


var getColor = function() {
  var cache = {};
  function getColor_(str) {
    if (cache[str]) {
      return cache[str];
    }

    var frag = parseInt(md5(str).substring(0,6), 16);
    
    var h = Math.floor(((frag & 0xff0000) >> 16) / 255 * 360) / 360;
    var s = Math.floor(((frag & 0xff00) >> 8) / 255 * 60 + 20) / 100;
    var l = Math.floor((frag & 0xff) / 255 * 20 + 30) / 100;

    //convert color with jQuery
    var colorCode = hslToColor(h, s, l);

    cache[str] = colorCode;
    return colorCode;
  }
  return getColor_;
}();

module.exports = getColor;