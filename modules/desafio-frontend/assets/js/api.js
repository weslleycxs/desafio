// Usado para se houver autenticação
var Api = {

    host: '/',

    get: function(url, obj){

        return Api.default(url, 'get', obj);

    },

    post: function(url, obj){

        return Api.default(url, 'post', obj);

    },

    request: function(url, method, obj){

        var headers = {};

        var jwt = localStorage.getItem('jwt');

        if(jwt) headers['x-access-token'] = jwt;

        var ajaxObj = {

            url: Api.host + url,
            type: method,
            data: obj,
            headers: headers

        }

        return $.ajax(ajaxObj);

    },

    default: function(url, method, obj){

        var onerror = function(res){

            // Caso contrário, vamos notificar o erro
            Alerts.notify(res.error);

            return Promise.reject();

        }

        if(obj.onerror){

            onerror = obj.onerror;

        }

        var btn = obj._btn || null;
        var loading;
        var handled = false;

        delete obj._btn;

        if(btn) loading = Helpers.loading(btn);

        // Impede que esse objeto vá para a requisição
        delete obj.onerror;

        return Api.request(url, method, obj).then(function(res){

            if(typeof res.success !== 'undefined'){

                res.status = res.success?'success':'error';

                if(res.success){

                    res.data = res.message;

                } else{

                    res.error = res.message;

                }

            }

            if(loading) loading.reset();

            handled = true;

            // Caso possua res.status
            if(typeof res.status !== 'undefined'){


                // Caso tenha dado algum erro no backend
                if(res.status == 'error'){

                    return onerror(res);

                }

                // Se tiver sido bem sucedido, vamos retornar o dado
                return res.data;

            }

            // No caso de não ter .status, vamos só retornar
            return res;

        }).catch(function(error){

            if(!handled){

                Alerts.notify('Ocorreu um erro inesperado<br>Tente novamente em minutos', 10000);

                if(loading) loading.reset();

            }

            return Promise.reject(error);

        });

    }

}