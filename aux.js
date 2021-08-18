const path = require('path');
const fs   = require('fs-extra');
const xlsx = require('xlsx');

module.exports = {

    getListCached(folder){

        let ret = [];

        return module.exports.listCached(folder).then(items => {
            
            let retPromise = [];

            items.forEach(item => {

                retPromise.push(module.exports.getCache(folder, item).then(contentItem => {

                    ret.push(contentItem);

                }));

            });

            return Promise.all(retPromise);

        }).then(() => {

            return ret;

        });

    },

    listCached(folder){

        let filepath = path.join(__dirname, 'cache', folder);

        return fs.readdir(filepath).then(entries => {

            entries.sort();

            return entries;

        });

    },

    setCache(folder, filename, object){

        let cacheDir = path.join(__dirname, 'cache', folder);

        return fs.ensureDir(cacheDir).then(() => {

            let filepath = path.join(cacheDir, filename + '.json');

            return fs.writeJson(filepath, object);

        });

    },

    // @deprecated due setCache
    addCache(folder, filename, object){

        return module.exports.setCache(folder, filename, object);

    },

    getCache(folder, file){

        if(!file) return console.error('File argument necessary');

        let sufix = '.json';

        if(file.substr(-5) == '.json') sufix = '';

        let filepath = path.join(__dirname, 'cache', folder, file + sufix);

        return fs.exists(filepath).then(exists => {

            if(!exists) return Promise.reject(file + ' not cached at ' + folder);

            return fs.readJson(filepath);

        });

    }

}