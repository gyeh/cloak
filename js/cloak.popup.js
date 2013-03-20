cloak.popup = (function() {

    function send_to_tab(type, method, callback) {
        if (cloak.DEBUG) {
            console.log('Popup sending command: ');
            console.log('type: ' + type + ', method: ' + method);
        }

        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id, 
                {'type': type, 'method': method}, callback);
        });
    }

    function init() {
        /*
         * NOTE: Remember to place "window.close()" as callback.
         * Sometimes Chrome is so fast, that it will call close()
         * before request gets sent out.
         *
         * However, you need to close the window asap.  These means
         * you need to receiver to send response asap as well.
         */

        $('#remove').click(function() {
            send_to_tab('enable_select', 'remove', function() {
                window.close();
            });
        });

        $('#invisible').click(function() {
            send_to_tab('enable_select', 'invisible', function() {
                window.close();
            });
        });

        $('#show').click(function() {
            send_to_tab('show_hidden', null, function() {
                window.close();
            });
        });

        $('#undo').click(function() {
            chrome.extension.sendRequest({
                'type': 'undo'
            });

            window.close();
        });

        $('#settings').click(function() {
            chrome.tabs.create({'url': chrome.extension.getURL(
                '/options.html'
            )}, function() {
                window.close();
            });
        });

        chrome.extension.sendRequest({
            'type': 'confirm_undo'
        }, function(response) {
            if (response.resp) {
                $('#undo img, #undo span').removeClass('disabled');
            } 
        });

        send_to_tab('get_block_count', null, function(response) {
            if (response.block_count && response.block_count !== 0) {
                $('#show img, #show span').removeClass('disabled');
            } 
        });
    }

    return {
        'init': init
    };

}());

$(cloak.popup.init);

