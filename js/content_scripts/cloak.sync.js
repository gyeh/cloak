cloak.sync = (function() {

    var _rules = []; //local cache
    var _shortcut = ''; //local cache

    function access_rules(callback) {
        chrome.extension.sendRequest({
            'type': 'get_domain_rules',
            'domain': document.domain
        }, function(response) {
            _rules = response.rules || [];
            if (callback) {
                callback(_rules);
            } 
        });
    }

    function get_rules() {
        return _rules;
    }

    function get_shortcut() {
        return _shortcut;
    }

    /* load new rule set anytime rules are added or deleted for domain */
    function request_handler(request, sender, sendResponse) {

        if (request.type === 'shortcut_sync') {
            _shortcut = request.shortcut;
            return;
        }

        request.domain = cloak.normalize(request.domain);
        if (request.domain === cloak.normalize(document.domain) &&
                request.rules) {

            _rules = request.rules || [];
        }
    }

    function init() {
        chrome.extension.onRequest.addListener(request_handler);

        chrome.extension.sendRequest({
            'type': 'shortcut_request'
        }, function(response) {
            _shortcut = response.shortcut;
        });
    }

    return {
        'init': init,
        'get_rules': get_rules,
        'get_shortcut': get_shortcut,
        'access_rules': access_rules
    };

}());

cloak.sync.init();

