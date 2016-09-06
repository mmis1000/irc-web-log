;(function () {
    var $ = window.$ || require("jquery");
    $(function () {
        /**
         * Check a href for an anchor. If exists, and in document, scroll to it.
         * If href argument ommited, assumes context (this) is HTML Element,
         * which will be the case when invoked by jQuery after an event
         */
        function scroll_if_anchor(event) {
            var href = typeof(event) == "string" ? event : $(this).attr("href");
            
            // You could easily calculate this dynamically if you prefer
            var fromTop = $('.header').height() + 2;
            
            // If our Href points to a valid, non-empty anchor, and is on the same page (e.g. #foo)
            // Legacy jQuery and IE7 may have issues: http://stackoverflow.com/q/1593174
            if(href.indexOf("#") == 0) {
                if (href.length === 1) {
                    event.preventDefault()
                    return false;
                }
                var $target = $(href);
                // Older browser without pushState might flicker here, as they momentarily
                // jump to the wrong position (IE < 10)
                if($target.get().length) {
                    $('html, body').animate({ scrollTop: $target.offset().top - fromTop });
                    if(history && "pushState" in history) {
                        history.pushState({}, document.title, window.location.pathname + href);
                        return false;
                    }
                }
            }
        }    
        
        // delay it a bit, so chrome won't broke this.
        setTimeout(function () {
            // When our page loads, check to see if it contains and anchor
            scroll_if_anchor(window.location.hash);
        }, 0);
        
        // Intercept all anchor clicks
        $("body").on("click", "a", scroll_if_anchor);
    });
} ());