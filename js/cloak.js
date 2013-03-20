cloak = (function(){
    var DEBUG = false;
    var ESC_KEYCODE = 27;
    var ANIMATION_SPEED = 390;
    var BORDER_THICKNESS = 2;

    function log(message, force){
        if(DEBUG || force){
            console.log(message);
        }
    }

    //normalize domain string
    function normalize(domain) {
        if (domain && domain.substr(0, 4) === 'www.') {
            domain = domain.substr(4);
        }
        return domain;
    }  

    //get domain from url.  compatible with 'normalize'
    function get_domain(url) {
        return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
    }

    function get_element_index(el) {
        var className = el.className;
        var id = el.id;

        var index = 1;  

        for (var sib = el.previousSibling; sib; sib = sib.previousSibling) {
            if (sib.nodeType == Node.ELEMENT_NODE) {
                index++;
            }
        }

        if (index > 1) {
            return index;
        }

        for (var sib = el.nextSibling; sib; sib = sib.nextSibling) {
            if (sib.nodeType == Node.ELEMENT_NODE) {
                return 1;
            }
        }
        return 0;
    }

    //create selector from dom element
    function create_selector(el) {
        var cssSelector = '';
        for (; el && el.nodeType == Node.ELEMENT_NODE; el = el.parentNode) {
            var component = el.tagName.toLowerCase();
            var index = 0;

            //element id serves as anchor 
            if (el.id) {
                if (cssSelector) {
                    cssSelector = '#' + el.id  + ' > ' + cssSelector;
                } else {
                    cssSelector = '#' + el.id;
                }
                break;

            } else if (component === 'img') {
                cssSelector = 'img[src="' + el.getAttribute('src') + '"]'
                    break;

            } else if (el.className) {
                var arr = el.className.split(" ");
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i]) {
                        component += '.' + arr[i];
                    }
                }
            }

            index =  get_element_index(el);

            if ((index > 0) && (el.tagName !== 'BODY')) {
                component += ':nth-child(' + index + ')';
            }

            if (cssSelector) {
                cssSelector = component + ' > ' + cssSelector;
            } else {
                cssSelector = component;
            }
        }
        return {'selector' : cssSelector};
    };

    return {
        'DEBUG': DEBUG,
        'ESC_KEYCODE': ESC_KEYCODE,
        'ANIMATION_SPEED': ANIMATION_SPEED,
        'BORDER_THICKNESS': BORDER_THICKNESS,
        'log': log,
        'normalize': normalize,
        'get_domain': get_domain,
        'create_selector': create_selector
    };
}());

