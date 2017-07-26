/* global $, channel, moment, config */

$('body').on('click', '.day-name', function (ev) {
    var current = $(ev.target).parent();
    console.log(current)
    if (current.hasClass('fold')) {
       // current.parent().find('.day').addClass('fold');
        current.removeClass('fold');
    } else {
        current.addClass('fold');
        //current.parent().find('.day').addClass('fold');
    }
})

var dayTemplete = $('.results .day').clone();
var resultTemplete = dayTemplete.find('.result.item').clone();
dayTemplete.find('.result.item').remove();
$('.results .day').remove();

var currentPage = 0;
var dayCache = {};

moment.locale(config.locale);

function addItem(item) {
    var time = new Date(item.time);
    
    var date = 
        moment(time)
        .utcOffset(config.timezone)
        .format('MM/DD');
        
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
    newItem.find('.from').text(item.from);
    newItem.find('.time').text(time);
    newItem.find('.message').text(item.message);
    newItem.appendTo(dayItem)
}

$('.submit').click(function () {
    currentPage = 0;
    var text = $('.search').val()
    $.get('/api/search', {text: text, page: currentPage, channel: channel}, function(res) {
        console.log(res);
        res.data.forEach(addItem)
    })
})
