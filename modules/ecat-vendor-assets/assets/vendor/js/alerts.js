function Alerts(){}

// Guarda o status se o usuário já clicou na tela
Alerts.userHasTapped = false;

Alerts.setup = function(){

    $('body').append($('<div class="alertsjs-modalarea"></div>'));

}

Alerts.closeIfExists = function(){

    if($('.modal-close').length){

        $('.modal-close').last().click();

        return true;

    }

    return false;

}

Alerts.pointerNotify = function(msg, opts){

    var delay   = opts;
    var offsetX = 30;
    var offsetY = 30;
    var ratioY  = 1;

    if(typeof delay !== 'number' && opts){

        delay = opts.delay;

        if(opts.offsetX) offsetX = opts.offsetX;
        if(opts.offsetY) offsetY = opts.offsetY;
        if(opts.ratioY)  ratioY  = opts.ratioY;

    }

    var elm = Alerts.notify(msg, delay);

    elm.addClass('pointer');

    elm.css('left', Environment.mouse.x + offsetX);
    elm.css('top', Environment.mouse.y  + offsetY * ratioY);
    elm.css('color', 'white');
    elm.css('padding', '5px');
    elm.css('bottom', 'unset');
    elm.css('width', 'fit-content');

    return elm;

}

Alerts.loading = function(html, opts){

    if(typeof opts === 'undefined'){

        opts = {
            tab: false
        }

    }

    var modal = Alerts.open('.loading', opts);

    modal.find('.body').html(html);

    Alerts.centralize(modal);

    return {

        close: function(){

            Alerts.close(modal);

        }

    }

}

Alerts.setList = function(opts){

    if(!opts) opts = {};

    if(!opts.oneRequired) opts.oneRequired = false;

    return new Promise(function(resolve, reject){

        Alerts.open('.alerts-list', {

            show: false,

            ready: function(modal){

                modal.find('.save').on('click', function(){

                    var selected = [];

                    modal.find('.list .selected').each(function(){

                        selected.push($(this).attr('data-value'));

                    });

                    if(opts.oneRequired && !selected.length) return Alerts.notify('Selecione ao menos um item');

                    resolve(selected);
                    Alerts.close(modal);

                });

                modal.find('.title').text(opts.title);

                var listElm = modal.find('.list');

                opts.items.forEach(function(item){

                    var val  = item;
                    var name = item;

                    // @todo melhorar
                    if(typeof item == 'object'){

                        val = JSON.stringify(item); 

                    }

                    if(typeof item.name !== 'undefined'){

                        name = item.name

                    }

                    var itemElm = $('<button data-value="' + name + '">' + name + '</button>');

                    console.log(opts.selected);

                    if(opts.selected){

                        opts.selected.forEach(function(selectedItem){

                            if(selectedItem.name == item.name){

                                itemElm.addClass('selected');

                            }

                        });

                    }

                    itemElm.on('click', function(){

                        if(itemElm.hasClass('selected')){

                            itemElm.removeClass('selected');

                        } else{

                            itemElm.addClass('selected');

                        }

                    });

                    listElm.append(itemElm);

                });

                Alerts.setLoaded(modal);

            }

        });

    });

}

// Alerts.list = function(){

//     var modal = Alerts.open('.alerts-list');

// }

// Diz que o modal está perfeito, então podemos definir o width e height
Alerts.setLoaded = function(modal){

    modal.width(modal.width());
    modal.height(modal.height());

    modal.removeClass('o-unloaded');

    Alerts.centralize(modal);
    modal.show();

    modal.find('[autofocus]').focus();

}

Alerts.todo = function(which){

    return Alerts.notify('@todo ' + which);

}

Alerts.ok = function(title, opts){

    if(!opts) opts = {};

    opts.yesbtn = 'Ok';
    opts.nobtn  = false;

    Alerts.ask(title, opts);

}

Alerts.asker = function(title, opts){

    if(typeof opts.description === 'undefined') opts.description = '';

    Alerts.open(null, {

        empty: true,
        show: false,
        tab: false,

        ready: function(modal){

            modal.addClass('alerts-ask');

            modal.append('\
                <h2>' + title + '</h2>\
                <small>' + opts.description + '</small>\
                <hr>\
                <p class="btns"></p>\
            ');

            delete opts.description;

            Object.keys(opts).forEach(function(btnName){

                var btn = $('<button>' + btnName + '</button>');

                btn.get(0)._alerts_action = opts[btnName];

                btn.on('click', function(){

                    this._alerts_action(modal);

                });

                modal.find('.btns').append(btn);

                modal.find('.btns').append('<span> </span>');

            });

            if(opts.ready) opts.ready(modal);

            Alerts.centralize(modal);

            modal.show();

        }

    });

}

// Faz uma pergunta boleana ao usuário
Alerts.ask = function(title, opts){

    if(typeof opts == 'undefined') opts = {};
    if(typeof opts.description === 'undefined') opts.description = '';

    if(typeof opts.yesbtn    === 'undefined') opts.yesbtn = 'Sim';
    if(typeof opts.yesAction === 'undefined') opts.yesAction = function(){
        return true;
    };

    if(typeof opts.nobtn     === 'undefined') opts.nobtn = 'Não';

    return new Promise(function(resolve, reject){

        Alerts.open(null, {

            empty: true,
            show: false,
            tab: false,

            ready: function(modal){

                modal.addClass('alerts-ask');

                modal.append('\
                    <h2>' + title + '</h2>\
                    <small>' + opts.description + '</small>\
                    <hr>\
                    <p class="btns"></p>\
                ');

                var yesBtn = $('<button>' + opts.yesbtn + '</button>');
                var noBtn  = $('<button>' + opts.nobtn  + '</button>');

                yesBtn.on('click', function(){

                    if(opts.yesAction(modal)){

                        resolve();
                        Alerts.close(modal);

                    }

                });

                noBtn.on('click', function(){

                    Alerts.close(modal);

                });

                modal.find('.btns').append(yesBtn);
                modal.find('.btns').append('<span> </span>');

                if(opts.nobtn){
                    
                    modal.find('.btns').append(noBtn);

                }

                if(opts.ready) opts.ready(modal);

                Alerts.centralize(modal);

                modal.show();

            }

        });

    });

}

Alerts.centralize = function(modal){

    modal.css('left', ($('body').width() / 2) - (modal.outerWidth() / 2));
    modal.css('top', ($('body').height() / 2) - (modal.outerHeight() / 2));

}

Alerts.__tabs = [];

Alerts.updateTabs = function(reload){

    if(typeof reload === 'undefined'){

        reload = true;

    }

    // É iniciado a variável responsável pelas guias
    var tabs = [];

    if(reload){

        // Ao passar por todos os modais, armazenamso a lista de guias
        $('body .alertsjs-modalarea .o-modal').each(function(){

            // Ignora todos os modais que não tem guia ativada
            if($(this).hasClass('no-tab')) return;

            var title = '';

            if($(this).find('.hidden .title').length){

                title = $(this).find('.hidden .title').html();

            } else if($(this).find('.title').length){

                title = $(this).find('.title').html();

            }

            if(!title){

                title = 'Sem título';

            }

            tabs.push({

                // Título da guia
                title: title,

                // Está minimizado?
                minimized: $(this).hasClass('modal-minimized'),

                // Guardar o modal para uso posterior
                modal: $(this)

            });

        });

        // Vamos limpar o elemento que guarda as guias
        $('.subheader .modals').empty();

        Alerts.__tabs = tabs;

    } else{

        Alerts.__tabs.forEach(function(tab){

            tab.minimized = tab.modal.hasClass('modal-minimized');

        });

    }

    // Passa por todas as guias
    Alerts.__tabs.forEach(function(tab){

        var modalTab = tab.elm;

        if(reload){

            // Cria o elemento da guia
            modalTab = $('<div class="modal-tab">' + tab.title + '</div>');

        }

        // Caso o modal esteja minimizado
        if(tab.minimized){

            // Mudamos o aspecto visual
            modalTab.addClass('maximize');

        } else{

            modalTab.removeClass('maximize');

        }

        if(tab.modal.hasClass('focused-modal')){

            modalTab.addClass('focused-tab');

        } else{

            modalTab.removeClass('focused-tab');

        }

        if(reload){

            // Quando a guia for clicada
            modalTab.on('click', function(){

                // E o modal tiver a classe minimizado
                if(tab.modal.hasClass('modal-minimized')){

                    // Vamos maximizar o modal
                    Alerts.maximize(tab.modal);

                } else{

                    // Caso contrário, vamos minimizar
                    Alerts.minimize(tab.modal);

                }

            });

        }

        tab.elm = modalTab;

        if(reload){

            // Por fim, vamos adicionar a guia ao elemento que guarda
            // todas as guias
            $('.subheader .modals').append(modalTab)

        }

    });

}

Alerts.log = function(content){

    console.log(content);

    Alerts.notify(content);

}

Alerts.blur = function(modal){

    modal.removeClass('focused-modal');

    Alerts.updateTabs(false);

}

Alerts.focus = function(modal){

    // Desfoca a modal atualmente focada
    $('.focused-modal').removeClass('focused-modal');

    // Remove o minimizado, caso esteja
    modal.removeClass('modal-minimized');

    // Foca a modal do argumento
    modal.addClass('focused-modal');

    // Atualiza o visual das tabs
    Alerts.updateTabs(false);

}

Alerts.open = function(cls, opts){

    if(typeof opts === 'undefined'){

        opts = {
            unique: false,
            data: {}
        }

    }

    if(typeof opts.show === 'undefined'){

        opts.show = true;

    }

    if(typeof opts.identifier === 'undefined'){

        opts.identifier = false;

    }

    if(typeof opts.replace === 'undefined'){

        opts.replace = false;

    }

    if(typeof opts.empty === 'undefined'){

        opts.empty = false;

    }

    if(typeof opts.tab === 'undefined'){

        opts.tab = true;

    }

    // Se houver identificador e já houver algum modal com este mesmo,
    // foca no modal e ignora o resto do código
    if(opts.identifier && $('.o-modal[data-identifier="' + opts.identifier + '"]').length){

        if(opts.replace){

            Alerts.close($('.o-modal[data-identifier="' + opts.identifier + '"]'));

        } else{

            return Alerts.focus($('.o-modal[data-identifier="' + opts.identifier + '"]'));

        }

    }

    if($('body .alertsjs-modalarea').length == 0) Alerts.setup();

    var modal = $('<div class="alerts-js o-modal o-unloaded"></div>');

    if(!opts.tab){
        modal.addClass('no-tab');
    }

    if(opts.empty){

        var clone = $('<div class="modal"></div>');

    } else{
        
        var clone = $('.modals .modal' + cls).clone();

    }

    // Adiciona o identificador ao modal
    if(opts.identifier){
        modal.attr('data-identifier', opts.identifier);
    }

    modal.append(clone);

    if(opts.data){

        Object.keys(opts.data).forEach(function(key){

            var aimElm = modal.find('[data-value=' + key + ']');

            if(aimElm.length){

                var tag = aimElm.get(0).tagName;

                var isInput = false;

                if(tag === 'INPUT'){

                    isInput = true;

                }

                if(isInput){

                    aimElm.val(opts.data[key]);

                } else{

                    aimElm.text(opts.data[key]);

                }

            }

        });

    }

    modal.hide();

    if($('.alerts-js ' + cls).length && opts.unique){

        $('.alerts-js ' + cls).parent().remove();

    }

    var appendedModal = $('body .alertsjs-modalarea').append(modal);

    Alerts.centralize(modal);

    // Permite que o modal se mova
    modal.draggable({

        // Mas impede em determinados elementos
        cancel: 'input,span,textarea,button,select,option'

    });

    modal.on('mousedown', function(){

        Alerts.focus(modal);

    });

    var actionArea = $('<div class="action-area"></div>');

    var minBtn   = $("<div class='min'>_</div>");
    var closeBtn = $("<div class='modal-close close'>x</div>");

    minBtn.on('click', function(){

        Alerts.minimize(modal);

    });

    actionArea.append(minBtn);
    actionArea.append(closeBtn);

    modal.append(actionArea);

    modal.find('.modal-close').on('click', function(){

        Alerts.close(modal);

        if(opts.onclose){

            opts.onclose();

        }

    });

    // Se estiver ativo, exibe o modal no mesmo instante
    if(opts.show) modal.show();

    if(opts.ready) opts.ready(modal);

    Alerts.focus(modal);

    Alerts.updateTabs();

    return modal;

}

Alerts.vibrate = function(ms){

    if(typeof ms == 'undefined') ms = 400;

    if(Alerts.userHasTapped) navigator.vibrate(ms);

}

Alerts.minimize = function(modal){

    modal.addClass('modal-minimized');
    Alerts.updateTabs();

    Alerts.blur(modal);

}

Alerts.maximize = function(modal){

    modal.removeClass('modal-minimized');
    Alerts.updateTabs();

    Alerts.focus(modal);

}

Alerts.close = function(modal){

    if(typeof modal === 'string') modal = $('.o-modal .modal' + modal);

    if(modal.parent().hasClass('o-modal')){
        modal = modal.parent();
    }

    // Simplesmente remove o modal
    modal.remove();

    // Remove a guia responsável por esse modal
    Alerts.updateTabs();

    // Foca no ultimo modal que não esteja minimizado
    Alerts.focus($('.o-modal:not(.modal-minimized)').last());

}

Alerts.getData = function(btn){

    var data = {};

    $(btn).find('[name]').each(function(){

        if($(this).attr('type') == 'checkbox'){

            data[$(this).attr('name')] = $(this).prop('checked');

        } else{

            data[$(this).attr('name')] = $(this).val();

        }

    });

    return data;

}

Alerts.showOnlyWhenWindowIsVisible = true;

Alerts.notifyToBeShown = [];

// @dry
Alerts.updateNotifyToBeShown = function(){

    $('.notify-to-be-shown').find('.n').text(Alerts.notifyToBeShown.length);

    if(Alerts.notifyToBeShown.length == 0){

        $('.notify-to-be-shown').parent().removeClass('ldesatived');

        setTimeout(function(){

            $('.notify-to-be-shown').parent().remove();

        }, 1000);

    }

}

Alerts.addNotifyToBeShown = function(notifyElm){

    Alerts.notifyToBeShown.push(notifyElm);

    if(!$('.notify-to-be-shown').length){

        var toShowElm = Alerts.notify('<p class="notify-to-be-shown"><span class="n">1</span> notificações ocultadas(<small>Clique para exibir</small>)</p>', 1000 * 60 * 60 * 24, {
            ignoreVisibilityState: true
        });

        toShowElm.on('click', function(){

            var alertToOpen = Alerts.notifyToBeShown.shift();

            if(alertToOpen && alertToOpen._open) alertToOpen._open();

            Alerts.updateNotifyToBeShown();

        });

    }

    Alerts.updateNotifyToBeShown();

}

Alerts.notify = function(msg, life, opts){

    if(typeof opts == 'undefined') opts = {};

    if(typeof opts.ignoreVisibilityState == 'undefined'){

        opts.ignoreVisibilityState = false;

    }
    
    if(!msg) return;
    
    if(typeof life === 'undefined') life = 4000;

    var notifyElm = $('<div></div>');
    notifyElm.addClass('notifica ldesatived');
    notifyElm.html(msg);
    
    $('body').append(notifyElm);
    
    notifyElm._open = function(){

        var olderNotify = $('.notifica:not(.ldesatived):not(.pointer)').last();

        var defaultBottom = 30;
        
        if(olderNotify.length){
              
            defaultBottom = Number($(olderNotify).css('bottom').replace('px', '')) + $(olderNotify).outerHeight() + 10;
        
        }
        
        notifyElm.css('bottom', defaultBottom);

        Alerts.vibrate();
        
        setTimeout(function(){
        
            notifyElm.removeClass('ldesatived')
        
        }, 10);
        
        setTimeout(notifyElm.close, life);

    }

    notifyElm.close = function(){
    
        notifyElm.addClass('ldesatived')
    
        setTimeout(function(){
    
            var olders = $('.notifica:not(.ldesatived):not(.pointer)');
    
            var totalBottom = 0;
            var lastHeight = 0;
    
            olders.each(function(k){
    
                if(k == 0){
    
                    $(this).css('bottom', 30);
        
                    totalBottom += 30 + $(this).outerHeight();
        
                } else{
        
                    totalBottom += 10 + lastHeight;
        
                    $(this).css('bottom', totalBottom);
        
                    lastHeight = $(this).outerHeight();
        
                }
    
            });
    
            notifyElm.remove();
    
        }, 300);
    
    }

    if(Alerts.showOnlyWhenWindowIsVisible && document.visibilityState && document.visibilityState == 'hidden' && !opts.ignoreVisibilityState){

        Alerts.addNotifyToBeShown(notifyElm);

    } else{

        notifyElm._open();

    }
    
    return notifyElm;

}

window.addEventListener('click', function(){

    Alerts.userHasTapped = true;

});
