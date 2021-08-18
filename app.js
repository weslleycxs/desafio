/*
* app.js
* Funções relacionadas ao status inicial do sistema
*/
module.exports = {

    // Status de cada estágio na inicialização do sistema
    loaded:  false,
    db:      false,
    started: false,

    // Funções que estão pendentes para rodar 
    loadList:  [],
    dbList:    [],
    startList: [],

    onload(f){

        if(module.exports.loaded) return f()

        module.exports.loadList.push(f)

    },

    ondb(f){

        if(module.exports.db) return f()

        module.exports.dbList.push(f)

    },

    onstart(f){

        if(module.exports.started) return f()

        module.exports.startList.push(f)

    },

    // Assim que o kugel for chamado
    load(){

        // Impede a lista de load ser carregada com mais itens
        module.exports.loaded = true

        // Se houver itens na lista de load
        if(module.exports.loadList.length){

            // Executa cada item da lista
            module.exports.loadList.forEach(f => f())

            // Limpa a lista, só para o garbage colector agir
            module.exports.loadList = []

        }

    },

    // Quando houver uma conexão com o banco de dados
    // @example Pode ser usado para verificar se existe um usuário administrador
    ondatabasestart(db){

        // Impede a adição na lista de db
        module.exports.db = db

        // Se houver itens na lista de db
        if(module.exports.dbList.length){

            // Executa cada item da lista
            module.exports.dbList.forEach(f => f())

            // Limpa a lista, só para o garbage colector agir
            module.exports.dbList = []

        }

    },

    // Assim que o express iniciar
    onstartserver(app){

        // Impede a adição de itens na lista de start
        module.exports.start = true

        // Se houver itens na lista de start
        if(module.exports.startList.length){

            // Executa cada item da lista
            module.exports.startList.forEach(f => f())

            // Limpa a lista, só para o garbage colector agir
            module.exports.startList = []

        }

        global.modules.module.getComponentStack('routing').forEach(routing => {

            routing(app);

        });

    }

}