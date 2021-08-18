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