/* global $, jQuery */


$(document).on('click', function (ev) {
    var _ = $(ev.target)
    var messageBody = _.parent().parent();
    if (_.is('.delete')) {
        if (!confirm('Do you really want to delete this?')) return;
        $.post('/api/admin/delete', {'id': messageBody.attr('id')}, function (data) {
            alert('deleted') 
            messageBody.slideUp(500, function () {
                messageBody.remove()
            })
        }).fail(function(err) { 
            alert('deleted failed ' + err) 
        });
    }
    if (_.is('.delete-with-media')) {
        if (!confirm('Do you really want to delete this with all its media?')) return;
        $.post('/api/admin/delete-with-media', {'id': messageBody.attr('id')}, function (data) {
            alert('deleted')
            messageBody.slideUp(500, function () {
                messageBody.remove()
            })
        }).fail(function(err) { 
            alert('deleted failed ' + err) 
        });
    }
})