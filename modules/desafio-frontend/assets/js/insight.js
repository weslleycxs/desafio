let Insight = {

    create(){

        Api.post('insight', {
            // 
        }).then(res => {

            console.log(res);

        });

    },

    load(){

        Api.get('insight', {

            // Necessário para saber por qual insight começar
            startAt: $('.insight-list .insight').length

        }).then(insights => {

            insights.forEach((insight, k) => {

                let insightElm = Gui.component('.insight', insight);

                insight.tag.forEach(tag => {

                    if(!tag) return;

                    let tagElm = $('<span class="tag">' + tag + '</span>');

                    // Quando alguém clica na tag, automaticamente vai para a busca
                    tagElm.on('click', (event) => {

                        event.originalEvent.stopPropagation();

                        $('.search input').val(tag);
                        $('.search input').trigger('input');

                    });

                    insightElm.find('.tag-holder').append(tagElm);

                });

                insightElm.css('opacity', 0);

                insightElm.on('click', () => Alerts.notify('Edição ainda não disponível'));

                $('.insight-list').append(insightElm);

                // Cria uma animação para a exibição dos itens
                setTimeout(() => {

                    insightElm.css('opacity', 1);

                    // Se tivermos chegado ao final
                    if(k == insights.length -1){

                        setTimeout(() => {

                            $('.footer').css('opacity', 1);

                        }, 200);

                    }

                }, 200 * k);

            });

        });

    },

    showMore(){

    }

}
