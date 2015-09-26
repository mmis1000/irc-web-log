/* global Hammer, config, moment */
function animateTo (pos) {
  if (pos === "#top") {
    $("html, body").stop().animate({ scrollTop: 0 }, 500);
  } else if (pos === "#bottom") {
    $("html, body").stop().animate({ scrollTop: $(document).height() }, 500);
  } else {
    if ($(pos).get(0)) {
      $(pos(0)).scrollIntoView()
    }
  }
}
if (config.selectedDay !== "today") {
  var earlierDays = $("#earlier");
  //console.log(otherDay);
  var currentDay = moment().utcOffset(config.timezone).startOf('day');
  for (var i = 0; i < 5; i++) {
    currentDay = currentDay.subtract(1, 'days');
    var dayOption = $("<option>")
      .text(currentDay.format('YYYY-MM-DD'))
      .val(currentDay.format('YYYY-MM-DD'));
    earlierDays.append(
      dayOption
    );
    
  }
  
  if (moment(config.selectedDay).utcOffset(config.timezone).add(6, 'days').isBefore(new Date)) {
    currentDay = moment(config.selectedDay);
    var dayOption = $("<option>")
      .text(currentDay.format('YYYY-MM-DD'))
      .val(currentDay.format('YYYY-MM-DD'));
    $(".date-select").prepend(dayOption);
  }
  
  $(".date-select").val(config.selectedDay);
}




var androidVersion = (/Android\s(\d\S*)/i).exec(navigator.userAgent);
var supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
if (androidVersion && 
  !supportsWebSockets &&
  parseFloat(androidVersion[1]) < 4.4 && 
  navigator.userAgent.search(/chrome/i) === -1 &&
  navigator.userAgent.search(/firefox/i) === -1) {
  $('html').addClass('buttom-nav');
}
//alert(navigator.userAgent);
$('button[data-href]').click(function () {
  animateTo($(this).attr('data-href'));
})

$('.date select').change(function () {
  var day = $(this).val();
    if (day !== 'others') {
    if (location.pathname.search(/\/$/) !== -1) {
      location.href = '../' + day + location.search
    } else {
      location.href = day + location.search
    }
  } else {
    alert('尚未完成')
  }
})
$('.menu').on('click', function () {
  $('.overlay').fadeIn(1000);
  $('.sidebar').addClass('show');
})

$('.overlay').on('click', function (ev) {
  if ( $(ev.target).is('.overlay') ) {
  $('.overlay').fadeOut(1000);
  $('.sidebar').removeClass('show');
}
})

function clearSelection() {
  if ( document.selection ) {
    document.selection.empty();
  } else if ( window.getSelection ) {
    window.getSelection().removeAllRanges();
  }
}

var hammerSidebar = new Hammer($('.sidebar').get(0),  {
  cssProps: {
    userSelect: true
  }
});
hammerSidebar.on('swipeleft', function () {
  clearSelection();
  $('.overlay').fadeOut(1000);
  $('.sidebar').removeClass('show');
})

var hammerMain = new Hammer($('#messages').get(0),  {
  cssProps: {
    userSelect: true
  }
});
hammerMain.on('swiperight', function () {
  clearSelection();
  $('.overlay').fadeIn(1000);
  $('.sidebar').addClass('show');
})