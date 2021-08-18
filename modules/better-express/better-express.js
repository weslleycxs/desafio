const fileUpload = require('express-fileupload')

module.exports = {}

global.modules.module.addToComponent('express-middleware', (req, res, next) => {

    res.ifcan = (permissions, promise) => {

        if(typeof permissions == 'string') permissions = [permissions]

        var includeAll = true

        permissions.forEach(function(permission){

            if(!req.decoded.permissions || !req.decoded.permissions.includes(permission)){

                includeAll = false

            }

        })

        if(includeAll || req.decoded.permissions.includes('admin')){

            res.std(promise)

        } else{

            res.std(Promise.reject('401 - No permission'))

        }

    }

    res.std = promise => {

        // Turn the result into a promise
        if(typeof promise.then === 'undefined') promise = Promise.resolve(promise);

        promise.then(result => {

            res.json({
                success: true,
                message: result,
                unixtime: new Date().getTime()
            });

        }).catch(e => {

            console.error('@error'.yellow, e.toString().red);

            if(typeof e === 'undefined') e = "";

            res.json({
                success: false,
                message: e.toString(),
                unixtime: new Date().getTime()
            });

        });

    }

    next()

})

global.modules.module.addToComponent('express-middleware', fileUpload())

global.app.onload(() => {

    // Warning: CORS
    if (global.config.cors) {

        global.modules.module.addToComponent('express-middleware', (req, res, next) => {

            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Credentials', 'true')
            res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, action, x-access-token')

            next()

        })

    }

})