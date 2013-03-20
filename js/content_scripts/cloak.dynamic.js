cloak.dynamic = (function() {

    function get_block_count() {

        var rules = cloak.sync.get_rules();
        var count = 0;

        for (var i = 0; i < rules.length; i++) {
            var method = rules[i].method;
            var $match = $(rules[i].selector);

            if ($match.length) {
                if ((method === 'remove') 
                        && ($match.css('display') === 'none')) {
                    count++;
                } else if ((method === 'invisible')
                        && ($match.css('visibility') === 'hidden')) {
                    count++;
                }
            }
        }

        return count;
    }

    /* re-render relevant elements to reflect changes */
    function update_ui() {
        set_badge_text();

        //update style-sheet; necessary due to possible dynamic changes
        cloak.static.apply_rules(cloak.sync.get_rules());
    }

    function set_badge_text() {
        chrome.extension.sendRequest({
            'type': 'set_badge_text',
            'text': get_block_count() || '' 
        });
    }

    function new_single_rule(rule) {
        var $rule = $(rule.selector);

        if (rule.method === 'remove') {
            $rule.fadeOut(cloak.ANIMATION_SPEED, function() {
                update_ui();
            });
        } else if (rule.method === 'invisible') {
            var opacity = $rule.css('opacity') || 1;
            $rule.animate({'visibility': 'hidden', 'opacity': '0'}, cloak.ANIMATION_SPEED, 
                function() {
                    $rule.css({'opacity': opacity, 'visibility': 'hidden'}); //revert opacity 
                    update_ui();
                }
            );
        } 

    }

    function delete_rule(selector) {
        $(selector).each(function() {
            var $rule = $(this);

            if ($rule.css('display') === 'none') {
                $rule.fadeIn(cloak.ANIMATION_SPEED, function() {
                    update_ui();
                });
            } else if ($rule.css('visibility') === 'hidden') {
                var opacity = $rule.css('opacity') || 1;
                $rule.css({'opacity': '0', 'visibility': 'visible'}); //setup values for animation
                $rule.animate({'opacity': opacity}, cloak.ANIMATION_SPEED, function() {
                    update_ui();
                });
            }
        });
    }

    function show_hidden() {
        var rules = cloak.sync.get_rules();

        for (var i = 0; i < rules.length; i++) {
            delete_rule(rules[i].selector);
        }
    }

    function check_shortcut(event, keystring) {
        if (keystring === cloak.sync.get_shortcut()) {
            show_hidden();
        }
    }

    function request_handler(request, sender, sendResponse) {
        request.domain = cloak.normalize(request.domain);

        if (request.type === 'show_hidden') {
            sendResponse();
            show_hidden();
            return;
        } 

        if (request.type === 'get_block_count') {
            sendResponse({'block_count': get_block_count()});
            return;
        } 

        if (request.domain === cloak.normalize(document.domain) &&
                request.rule) {

            if (request.type === 'new_single_rule') {
                new_single_rule(request.rule);
            } else if (request.type === 'delete_single_rule') {
                delete_rule(request.rule.selector);
            } else if (request.type === 'edit_single_rule') {
                delete_rule(request.rule.selector);
                new_single_rule(request.rule);
            } 
        }
    }

    function init() {
        chrome.extension.onRequest.addListener(request_handler);
        set_badge_text();

        //setup keyboard shortcut handler
        keanu.init();
        keanu.add_keystring_listener(check_shortcut);
    }

    return {
        'init': init
    };

}());

$(cloak.dynamic.init);







