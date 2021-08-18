let uuid = require('uuid');
let path = require('path');
let fs   = require('fs-extra');

const Database = require(global.dir.root + '/aux.js');

module.exports = (router) => {

    router.post('/insight', (body) => {

        let insightId = uuid();

        body.id = insightId;

        return Database.setCache('insight', insightId, body);

    });


    router.get('/insight', (body) => {

        // @todo Paginação

        return Database.getListCached('insight');

    });

    router.put('/insight', (body) => {

        return Database.setCache('insight', body.id, body);

    });

}

