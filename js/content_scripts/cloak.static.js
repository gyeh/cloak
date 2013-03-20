cloak.static = (function() {

    function apply_rules(rules) {
        if (rules && (rules.length !== 0)) {
            //delete existing style sheets
            $('#cloak-style-display').remove();
            $('#cloak-style-invisible').remove();

            var selectors = construct(rules);
            var style;

            if (selectors.css_remove) {
                style = document.createElement('style');
                style.id = 'cloak-style-display';
                style.innerText = selectors.css_remove + '{ display : none; } ';
                document.documentElement.appendChild(style);
            }

            if (selectors.css_invisible) {
                style = document.createElement('style');
                style.id = 'cloak-style-invisible';
                style.innerText += selectors.css_invisible + '{ visibility : hidden }';
                document.documentElement.appendChild(style);
            }
        }
    }

    function construct(rules) {
        var css_remove = '';
        var css_invisible = '';
        var toAdd;

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                toAdd = rules[i].selector;
                if (toAdd) {

                    if (rules[i].method === 'remove') {
                        if (css_remove) {
                            css_remove += ',';
                        }
                        css_remove += toAdd;

                    } else {
                        if (css_invisible) {
                            css_invisible += ',';
                        } 

                        css_invisible += toAdd;
                    }
                }
            }
        }

        return {
            'css_remove': css_remove, 
            'css_invisible': css_invisible
        };
    }

    function init() {
        cloak.sync.access_rules(apply_rules)
    }

    return {
        'init': init,
        'apply_rules': apply_rules
    };

}());

cloak.static.init();


