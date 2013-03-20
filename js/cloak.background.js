cloak.background = (function(){
    var _rules = {};
    var _last_added_rule = null;
    var _badge_state = [];  //true => tab is under "selection"

    function load() {
        cloak.log('Loading rules from localStorage');
        var tmp = localStorage['rules'];

        if (tmp) {
            _rules = JSON.parse(tmp);
        } else {
            _rules = {};
            localStorage["rules"] = "{}";
        }
    }

    function save() {
        localStorage['rules'] = JSON.stringify(_rules);

        if (cloak.DEBUG) {
            console.log('Saving rules: ' + localStorage['rules']);
        }

        //update options pages with latest changes
        chrome.extension.sendRequest({'type': 'render_options', 'rules': _rules}); 
    }

    // broadcast rule to open tabs
    function broadcast_rule(request_type, domain, rule) {
        //apply new rule to all tabs
        chrome.windows.getAll({'populate': true}, function (chrome_windows) {
            for (var i = 0; i < chrome_windows.length; i++) {
                var tabs = chrome_windows[i].tabs;
                for (var j = 0; j < tabs.length; j++) {

                    if (domain === cloak.get_domain(tabs[j].url)) {
                        chrome.tabs.sendRequest(tabs[j].id, {
                            'type': request_type, 
                            'domain': domain,
                            'rule': rule,
                            'rules':  _rules[domain]
                        });
                    }
                }
            }
        });
    }

    function find_rule(domain, rule, success_callback, fail_callback) {
        if (domain && rule) {
            var rule_arr = _rules[domain];

            if (rule_arr) {
                for (var i = 0; i < rule_arr.length; i++) {
                    if (rule_arr[i].selector === rule.selector) {
                        success_callback && success_callback(rule_arr[i], i);
                        return;
                    }
                }
            }

            fail_callback && fail_callback();
        }

    } 
    
    function new_rule_handler(request) {
        var domain = request.domain,
            rule = request.rule;

        _last_added_rule = {'domain': domain, 'rule': rule};

        find_rule(domain, rule, 
            function(found_rule, index) {
                found_rule.method = rule.method;
                save();
                broadcast_rule('edit_single_rule', domain, found_rule);
            }, 
            function() {
                //cannot find rule.  hence, make a new one!
                if (!_rules[domain]) {
                    _rules[domain] = [];
                }
                _rules[domain].push(rule);
                save();
                broadcast_rule('new_single_rule', domain, rule);
            }
        );
    }

    function delete_rule_handler(request) {
        if (!request) {
            return;
        }

        var domain = request.domain,
            rule = request.rule;

        find_rule(domain, rule, function(found_rule, index) {
            //disable undo
            if (_last_added_rule 
                && (domain ===  _last_added_rule.domain) 
                && (rule.selector === _last_added_rule.rule.selector)) {

                _last_added_rule = null;
            }

            _rules[domain].splice(index, 1);

            if (_rules[domain].length === 0) {
                delete _rules[domain];
            }

            save();
            broadcast_rule('delete_single_rule', domain, rule);
        });
    }

    function edit_rule_handler(request) {
        var domain = request.domain,
            rule = request.rule,
            property = request.property,
            value = request.value;

        find_rule(domain, rule, function(found_rule) {
            found_rule[property] = value;
            save();
            broadcast_rule('edit_single_rule', domain, found_rule);
        });
    }

    function set_badge_text(text, tabId) {
        text = text || '';

        if (tabId) {
            if (text === '#t') {
                _badge_state[tabId] = true;
                chrome.browserAction.setBadgeText({'text': '...', 'tabId': tabId});
            } else if (text === '#f') {
                _badge_state[tabId] = undefined;
                chrome.browserAction.setBadgeText({'text': '', 'tabId': tabId});
            } else if (_badge_state[tabId] === undefined) {

                if (text) {
                    chrome.browserAction.setIcon({
                        'path': 'img/icon-128.png', 
                        'tabId': tabId
                    });
                    chrome.browserAction.setTitle({
                        'title': 'Cloak (' + text + ' rules applied)', 
                        'tabId': tabId
                    });
                } else {
                    chrome.browserAction.setIcon({
                        'path': 'img/icon-128_inactive.png', 
                        'tabId': tabId
                    });
                    chrome.browserAction.setTitle({
                        'title': 'Cloak (No rules applied)', 
                        'tabId': tabId
                    });
                    
                }
            }  

        }
    }

    function undo_handler(request, sender, sendResponse) {
        delete_rule_handler(_last_added_rule);
        _last_added_rule = null;
    }

    function confirm_undo_handler(request, sender, sendResponse) {
        if (_last_added_rule) {
            sendResponse({'resp': true});
        } else {
            sendResponse({'resp': false});
        }
    }

    function request_handler(request, sender, sendResponse) {
        if (cloak.DEBUG) {
            console.log('Request to background: ');
            console.log(request);
        }

        request.domain = cloak.normalize(request.domain);

        if (request.type === 'get_domain_rules') {
            sendResponse({'rules': _rules[request.domain]});
        } else if (request.type === 'set_badge_text') {
            set_badge_text(request.text, sender.tab.id);
        } else if (request.type === 'shortcut_request') {
            sendResponse({'shortcut': localStorage['shortcut'] || ''});
        } else if (request.type === 'get_all_rules') {
            sendResponse({'rules': _rules});
        } else if (request.type === 'new_rule') {
            new_rule_handler(request, sender, sendResponse); 
        } else if (request.type === 'edit_rule') {
            edit_rule_handler(request, sender, sendResponse);
        } else if (request.type === 'delete_rule') {
            delete_rule_handler(request, sender, sendResponse);
        } else if (request.type === 'undo') {
            undo_handler(request, sender, sendResponse);
        } else if (request.type === 'confirm_undo') {
            confirm_undo_handler(request, sender, sendResponse);
        }
    }

    function setup_badge_updates() {

        chrome.browserAction.setBadgeBackgroundColor({'color': [102, 102, 102, 50]});

        //update badge to proper value (in case of dynamic changes to page)
        setInterval(function() {
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.sendRequest(tab.id, {'type': 'get_block_count'}, 
                    function(response) {
                        set_badge_text(response.block_count, tab.id);
                    }
                );
            });
        }, 3000);
    }

    function init() {
        load();
        chrome.extension.onRequest.addListener(request_handler);
        setup_badge_updates();

        window.addEventListener('storage', load, function() {
            cloak.log('External storage change occured');
        });
    }

    return {
        'init': init
    };
}());

cloak.background.init();


