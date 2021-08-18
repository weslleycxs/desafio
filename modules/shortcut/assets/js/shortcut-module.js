Kugel.module.registerModule('shortcut', {

    package: {

        name: 'shortcut',
        jsObjectName: 'ShortcutModule',

        onrender: function(elm){

            var shortcutFound = $(elm).attr('data-data');

            shortcut.add(shortcutFound, function(){

                elm.click();

            });

        }

    },

    register: function(){

        return ShortcutModule.package;

    }

});