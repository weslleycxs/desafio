var Insight = {

    create: function(){

        Api.post('insight', {
            // 
        }).then(function(res){

            console.log(res);

        });

    },

    load: function(){

        Api.get('insight', {}).then(insights => {

            // var insightElm = Gui.component('.insight', insights);

            insights.forEach(function(insight){

                var insightElm = $('<div class="insight"><span class="text">' + insight.text + '</span></div>')

                insightElm.on('click', function(){

                    Alerts.notify('Edição ainda não disponível');

                });

                $('.insight-list').append(insightElm);


            });

        });

    }

}

var Gui = {

    component: function(qs, obj){

        var elm = $('.components').find(qs).clone();

        elm.find('[data-value]').each(function(){

            var propName = $(this).attr('data-value');

            var val = obj[propName];

            if($(this).attr('data-mask')){

                switch(propName){

                    case 'cnpj':

                        val = Helpers.toCnpj(val);

                    break;

                }

                console.log(val);

            }

            // @todo Verificar o tipo do elemento, se for do tipo input, devemos adicionar
            // o valor por val ao invés de html

            if(val) $(this).html(val);

        });

        return elm;

    }

}