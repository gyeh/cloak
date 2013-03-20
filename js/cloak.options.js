cloak.options = (function() {

    var send_request = chrome.extension.sendRequest;

    function render(rules) {
        var toAdd = document.createDocumentFragment();
        var $template = $('#templates .domain_rule');

        //iterate each domain
        $.each(Object.keys(rules), function(key, domain) {

            var $new_domain_rule = $template.clone();

            $new_domain_rule.find('.domain').text(domain);

            render_rules(domain, $new_domain_rule, rules[domain]);
            toAdd.appendChild($new_domain_rule[0]);
        });

        $('#domain_list').html(toAdd);

        if (Object.keys(rules).length === 0) {
            $('<div id="empty_list_msg"><em>No rules added.</em></div>').appendTo('#domain_list');
        }

    }

    // render rules for given domain and appends to $domain_el
    function render_rules(domain, $domain_el, rule_arr) {

        var $template =  $('#templates .rule');

        $.each(rule_arr, function(key, rule) {
            var $new_rule = $template.clone();
            var $select = $new_rule.find('select');

            $new_rule.find('.delete').click(function(e) {
                e.preventDefault();
                $new_rule.fadeOut('slow', function() {
                    send_request({'type': 'delete_rule', 'domain': domain, 'rule': rule}); 
                });
            });

            $select.val(rule.method);
            $select.change(function() {
                send_request({
                    'type': 'edit_rule', 
                    'domain': domain, 
                    'rule': rule, 
                    'property': 'method', 
                    'value': $(this).val()
                }); 
            });

            $new_rule.find('.selectors').text(rule.selector);
            $new_rule.find('.selectors').attr('title', rule.selector);

            $new_rule.appendTo($domain_el.find('.rule_list'));
        });
    }

    function shortcut_handler(event){
        event.preventDefault();
        var $shortcut_area = $(event.currentTarget);
        var previous_shortcut = $shortcut_area.text();
        $shortcut_area.text('');  //clear when clicked

        // Clicking the bar again should cancel
        $shortcut_area.unbind('mouseup', shortcut_handler);

        keanu.listen({
            'max_keys': 2,
            'on_update': function(keystring) {
                if(keystring){
                    $shortcut_area.text(keystring);
                }
            },
            'on_set': function(keystring) {
                if(keystring){
                    $shortcut_area.text(keystring);
                    localStorage['shortcut'] = keystring;
                    shortcut_sync(keystring);
                } else {
                    $shortcut_area.text(previous_shortcut);
                }
            },
            'on_complete': function() {
                setTimeout(function(){
                    $shortcut_area.bind('mouseup', shortcut_handler);
                } , 200);
            }
        });
    }

    // broadcast rule to open tabs
    function shortcut_sync(shortcut) {
        //apply new rule to all tabs
        chrome.windows.getAll({'populate': true}, function (chrome_windows) {
            for (var i = 0; i < chrome_windows.length; i++) {
                var tabs = chrome_windows[i].tabs;
                for (var j = 0; j < tabs.length; j++) {
                    chrome.tabs.sendRequest(tabs[j].id, {
                        'type': 'shortcut_sync', 
                        'shortcut': shortcut
                    });
                }
            }
        });
    }

    function request_handler(request, sender, sendResponse) {
        if (request.type === 'render_options') {
            render(request.rules);
        }
    }

    function init() {
        send_request({'type': 'get_all_rules'}, function(response) {
            render(response.rules);
        });

        chrome.extension.onRequest.addListener(request_handler);

        //default shortcut if none
        // if (!localStorage['shortcut']) {
            // localStorage['shortcut'] = '17_32';
        // }

        $('#shortcut textarea')
            .text(localStorage['shortcut'])
            .bind('mouseup', shortcut_handler);


        $('#shortcut img').click(function(e) {
            e.preventDefault();
            localStorage['shortcut'] = 'None';
            $('#shortcut textarea').text('None');
        });
    }

    return {
        'init': init
    };
}());

$(cloak.options.init);





