var Kugel = {

    modules: [],

    moduleObj: {},

    log: function(msg){

        // @todo Registro não volátil

        console.log(msg);

    },

    module: {

        components: {},
        componentsStack: {},

        runComponent: function(name, obj){

            console.log(Kugel.module.components)

            return Kugel.module.components[name].oncomponent(obj);

        },

        runComponentStack: function(name, obj){

            return Kugel.module.getComponentStack(name).then(function(stackItems){

                stackItems.forEach(function(stackItem){

                    stackItem.onload(obj);

                });

            });

        },

        getComponentStack: function(name){

            // @todo Revisar, pois não é sincrono
            return Promise.resolve(Kugel.module.componentsStack[name]);

        },

        addComponent: function(name, obj){

            if(typeof Kugel.module.components[name] !== 'undefined'){

                console.log('@warn O módulo ' + Kugel.module.components[name].moduleFather + ' já registrou o componente ' + name);

                return;

            }

            if(typeof obj.onregister == 'undefined'){

                console.log('@warn O componente ' + name + ' não tem .onregister');

                return;

            }

            if(typeof obj.oncomponent == 'undefined'){

                console.log('@warn O componente ' + name + ' não tem .oncomponent');

                return;

            }

            Kugel.module.components[name] = obj;

            if(typeof Kugel.module.componentsStack[name] === 'undefined'){

                Kugel.module.componentsStack[name] = [];

            } else{

                Kugel.module.componentsStack[name].forEach(function(component){

                    Kugel.module.tryLoad(component);

                });

            }

            obj.onregister();

        },

        addToComponent: function(name, obj){

            if(typeof Kugel.module.componentsStack[name] === 'undefined'){

                Kugel.module.componentsStack[name] = [];

            }

            Kugel.module.componentsStack[name].push(obj);

            Kugel.module.tryLoad(obj);

        },

        tryLoad: function(obj){

            // Caso o módulo já esteja registrado
            if(Kugel.module.components[obj.name]){

                // @todo Verificar necessidade
                if(obj.loaded) return;

                return Promise.resolve(Kugel.module.components[obj.name].oncomponent(obj)).then(() => {

                    // Modifica o objeto do componente, para indicar carregamento
                    obj.loaded = true;

                });

            }

        },

        registerModule: function(name, obj){

            // @dry #239828931#
            if(typeof obj.package == 'undefined'){

                Kugel.log('inexistent_package_on_register', {
                    name: name
                });

                console.log('É necessário possuir .package para registro do módulo');

                return;

            }

            // @dry #239828931#
            if(typeof obj.package.jsObjectName == 'undefined'){

                Kugel.log('inexistent_jsObjectName_on_register', {
                    name: name
                });

                console.log('É necessário possuir .package.jsObjectName para registro do módulo');

                return;

            }

            window[obj.package.jsObjectName] = obj;

            Kugel.module.register(obj.package.name, window[obj.package.jsObjectName]);

        },

        register: function(name, obj){

            Kugel.modules.push({
                name: name,
                obj: obj
            });

            // @dry #239828931#
            if(typeof obj.package == 'undefined'){

                Kugel.log('inexistent_package_on_register', {
                    name: name
                });

                console.log('É necessário possuir .package para registro do módulo');

                return;

            }

            // @dry #239828931#
            if(typeof obj.package.onrender == 'undefined'){

                Kugel.log('inexistent_onrender_on_register', {
                    name: name
                });

                console.log('É necessário possuir .package.onrender para registro do módulo');

                return;

            }

            Kugel.moduleObj[name] = obj;

            if(obj.register) obj.register();

        },

        trigger: function(elm){

            var moduleName = $(elm).attr('data-module');

            console.log(moduleName);

            // Se por algum motivo tal modulo não exista
            if(typeof Kugel.moduleObj[moduleName] == 'undefined'){

                Kugel.log('inexistent_module', {
                    moduleName: moduleName
                });

                return;

            }

            Kugel.moduleObj[moduleName].package.onrender(elm);

            $(elm).addClass('activated');

        }

    }
    
}

// @todo Testando performance
setInterval(function(){

    // Passa por cada elemento que não está ativado
    $('[data-module]:not(.activated)').each(function(){

        console.log('Passando por módulo não ativado!', this);

        // Tenta ativar esse modulo seguindo o padrão kugel
        Kugel.module.trigger(this);

    });

}, 1000);

Kugel.module.addToComponent('alerts-ui-actions', {

    action: 'RELOAD_ON_CHECKSUM_UPDATE',

    onload: function(elm, action){

        Help.upgrade();

    }

});