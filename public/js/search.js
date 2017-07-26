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
    newItem.find('.from').text(item.fromName);
    newItem.find('.time').text(time);
    newItem.find('.message').text(item.message);
    newItem.find('a').attr('href', '/channel/' + channel + '/' + date + '/#' + item._id)
    
    newItem.appendTo(dayItem)
}

$('.submit').click(function () {
    currentPage = 0;
    text = $('.search').val()
    $.get('/api/search', {text: text, page: currentPage, channel: channel}, function(res) {
        console.log(res);
        $('.results').empty();
        currentPage = 0;
        dayCache = {};
        res.data.forEach(addItem)
        if (res.hasMore) {
            $('.load-more').removeClass('hidden')
        } else {
            $('.load-more').addClass('hidden')
        }
    })
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