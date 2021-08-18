let uuid = require('uuid');
let path = require('path');
let fs   = require('fs-extra');

fs.ensureDirSync(path.join(global.dir.assets, 'files'));

module.exports = (router) => {

    router.post('/api/generate-link', (body) => {

        let fileName = uuid();
        let destination = path.join(global.dir.assets, 'files', fileName);

        return global.modules['gdown.pl'].download(body.input, destination).then(format => {

            return fileName + format;

        }).then(finalFileName => {

            let sufixURL = ':' + process.env.PORT;

            if(process.env.HOST != 'localhost') sufixURL = '';

            return process.env.PROTOCOL + '://' + process.env.HOST + sufixURL + '/files/' + finalFileName;

        }).then(publicLink => {

            return `https://www.photopea.com#%7B%22files%22:%5B%22${publicLink}%22%5D,%22environment%22:%7B%7D%7D`;

        });

    });

}