cloak.select = (function() {

    var _borders = '<div id="cloak-borders-div"><div id="cloak-left-border" class="cloak-borders"></div><div id="cloak-right-border"  class="cloak-borders"></div><div id="cloak-top-border" class="cloak-borders"></div><div id="cloak-bottom-border" class="cloak-borders"></div></div>';

    function enable(method) {
        if (cloak.DEBUG) {
            console.log('Enabling select');
        }
        
        chrome.extension.sendRequest({
            'type': 'set_badge_text',
            'text': '#t'
        });

        //register event listeners
        $('body').bind({
            'mouseover.cloak_select': function(e) {
                e.preventDefault();

                if ((cloak.DEBUG) && (e.target.nodeName === 'EMBED')) {
                    console.log('Mouseover embed element');
                }

                if ((e.target.className !== 'cloak-borders') 
                    && (e.target.nodeName !== 'EMBED')) {
                    render(e.target);
                }
            }, 
            'click.cloak_select': function(e) {
                e.preventDefault();

                //only allow valid selected elements
                if ((e.target.className !== 'cloak-borders')  
                    && (e.target.nodeName !== 'EMBED')) {
                    disable();

                    var result = cloak.create_selector(e.target);
                    result.method = method;

                    chrome.extension.sendRequest({
                        'type': 'new_rule',
                        'domain': document.domain,
                        'rule': result
                    });
                }
            },
            'keydown.cloak_select': function(e) {
                e.preventDefault();
                disable();
            }
        });
    }

    function disable() {
        //unregister events
        $('body').unbind('.cloak_select');

        //remove borders
        $('#cloak-borders-div').remove();

        chrome.extension.sendRequest({
            'type': 'set_badge_text',
            'text': '#f'
        });
    }

    function render(element) {
        var $element = $(element);

        if ($element.length) {
            show_borders($element.offset().top, 
                $element.offset().left, 
                $element.outerWidth(), 
                $element.outerHeight());
        }
    };

    function show_borders(top, left, width, height) {

        if ($('#cloak-borders-div').length === 0) {
            $(_borders).appendTo('body');
        }

        $('.cloak-borders').css({
            'background-color': '#B0B0B0',
            'position': 'absolute',
            'z-index': '2147483550',
            '-webkit-box-shadow': '0px 0px 7px #B0B0B0'
        });

        $('#cloak-left-border').css({
            'top': top,
            'left': left,
            'width': cloak.BORDER_THICKNESS,
            'height': height
        });

        $('#cloak-top-border').css({
            'top': top,
            'left': left,
            'width': width,
            'height': cloak.BORDER_THICKNESS
        });

        $('#cloak-right-border').css({
            'top': top,
            'left': left + width,
            'width': cloak.BORDER_THICKNESS,
            'height': height
        });

        $('#cloak-bottom-border').css({
            'top': top + height,
            'left': left,
            'width': width + 2,
            'height': cloak.BORDER_THICKNESS
        });
    };   

    function request_handler(request, sender, sendResponse) {
        if (request.type === 'enable_select') {
            sendResponse(); //response quickly so no blocking
            disable();
            enable(request.method);
        }
    }

    function init() {
        chrome.extension.onRequest.addListener(request_handler);
    }

    return {
        'init': init
    };

}());

cloak.select.init();

