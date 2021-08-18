process.env.TZ = 'America/Sao_Paulo'

const path = require('path')
const fs   = require('fs-extra')

require('colors')

const package = require('./package.json')

let Logs = require('./logs')
let Util = require('./util')

Logs.init(__dirname + '/.logs')

// Require configuration file
global.config = package.kugel.config

if(!process.env.APP_NAME || !process.env.SECRET){

    setTimeout(Util.env.generate, 1000)

    return

}

const port     = process.env.PORT     || 8080
const host     = process.env.HOST     || 'localhost'
const protocol = process.env.PROTOCOL || 'http'

// @todo Rodar função global.config.setup para aliviar esse arquivo
// e deixar o sistema mais modular

module.exports = {

    lightstart(f){

        return f()

    },

    finalstart(f){

        global.app.load()

        return f()

    }

}

// @todo No kugel, deve-se ser capaz de definir isso dentro do arquivo de declaração do projeto
if(!process.env.SKUS_IMAGE){

    process.env.SKUS_IMAGE = path.join(global.dir.storage, 'product-images')

}

fs.ensureDirSync(global.dir.models)
fs.ensureDirSync(global.dir.storage)
fs.ensureDirSync(global.dir.modules)
fs.ensureDirSync(global.dir.helpers)
fs.ensureDirSync(global.dir.routes)
fs.ensureDirSync(global.dir.controllers)
fs.ensureDirSync(global.dir.doc)

fs.ensureDirSync(path.join(global.dir.doc, 'generated-files'))

fs.ensureDirSync(global.dir.data)

if(global.dir.views){

    fs.ensureDirSync(global.dir.views)

}

if (global.dir.assets) {

    fs.ensureDirSync(global.dir.assets)

}

// Require main modules
const express = require('express')
const http    = require('http')
const fileUpload = require('express-fileupload')

if(global.config.modules){

    global.dir.modules = path.join(global.dir.root, 'modules')

    fs.ensureDirSync(global.dir.modules)

}

// Aqui, geramos as chaves .pem
if(global.config.jwt) Util.generateKeyPairs()

// Enable the socket io
if (global.config.socket) {
    var socket = require('socket.io')
}

// Enables the module of gzip compression
if (global.config.gzip) {
    var compression = require('compression')
}

if (global.config.morgan) {
    var morgan = require('morgan')
}

if (global.config.session) {
    var session     = require('express-session')
    var mysql_store = require('express-mysql-session')(session)

    if (global.config.socket) {
        var io_session = require('express-socket.io-session')
    }
}

if (global.config.body_parser){
    var bodyParser  = require('body-parser')
}

if(global.config.database){

    // Armazena a instancia do banco de dados
    global.Database = require(global.dir.root + '/database.js')
    global.db       = global.Database

    if(global.app.ondatabasestart) global.app.ondatabasestart()

}

if(global.config.socket){

    global.socket = require(path.join(global.dir.root, 'socket.js'))

}

// Set the constants
const app = express()

if (global.config.body_parser) {

    app.use(bodyParser.json({

        limit: process.env.BODYPARSER_LIMIT || '250mb'

    }))

    app.use(bodyParser.urlencoded({

        limit: process.env.BODYPARSER_LIMIT || '250mb',

        // @todo Verificar necessidade de colocar o extended em .env
        extended: true

    }))

}

// Warning: CORS
if (global.config.cors) {

    app.use((req, res, next) => {

        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Credentials', 'true')
        res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, action, x-access-token')

        next()

    })

}

app.use(fileUpload())

global.modules.module.getComponentStack('express-middleware').forEach(middleware => {

    app.use(middleware)

})

var server = http.createServer(app)

if (global.config.socket) {
    var io = socket.listen(server)
}

// Configure the gzip
if (global.config.gzip){

    app.use(compression({filter: shouldCompress}))
     
    function shouldCompress (req, res) {
      if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false
      }
     
      // fallback to standard filter function
      return compression.filter(req, res)
    }

}

// Enable delivery of static content
if (global.config.assets) {

    fs.ensureDirSync(path.join(global.dir.assets, 'js'))
    fs.ensureDirSync(path.join(global.dir.assets, 'css'))

    fs.ensureDirSync(path.join(global.dir.assets, 'vendor', 'js'))
    fs.ensureDirSync(path.join(global.dir.assets, 'vendor', 'css'))

    // Configure the assets folder
    app.use(express.static(global.dir.assets))

}

// Template engine
if (global.config.template_engine) {

    app.set('cache view', true)

    app.set('views', global.dir.views)
    app.set('view engine', global.config.template_engine)

}

// Setup the morgan looger
if (global.config.morgan) app.use(morgan('dev', {

    skip: function (req, res) {

        var splited = req.originalUrl.split('/')

        if(req.url === '/api/instance-data') return true

        if(splited[1] === 'customer' && splited[splited.length-1] === 'image'){
            return true
        }

    }

}))

// Handles the session
if (global.config.session) {

    // Store session on mysql
    var session_store = new mysql_store({}, global.Database)

    // Express session
    var express_session = session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
        store: session_store
    })

    // Express session manager
    app.use(express_session)

}

if (global.config.session && global.config.socket){
    // Handles the shared session of socket io-express
    io.use(io_session(express_session, {
        autoSave:true
    }))
}

fs.readdirSync(global.dir.helpers).forEach((file) => {

    global.helpers[file.replace('.js', '')] = require(path.join(global.dir.helpers, file))

})

global.app.onload(() => {

    // Passa por cada arquivo dentro de routes e o inicia
    fs.readdirSync(global.dir.routes).forEach(routeName => {

        let routeFile = path.join(global.dir.routes, routeName)

        let routeObj = require(routeFile)

        if(typeof routeObj === 'object') return

        let router = new express.Router()

        routeObj({

            get(route, f){

                router.get(route, (req, res) => {

                    res.std(f(req.query))

                })

            },

            post(route, f){

                router.post(route, (req, res) => {

                    res.std(f(req.body))

                })

            },

            put(route, f){

                router.put(route, (req, res) => {

                    res.std(f(req.body))

                })

            },

            jwt: {

                get(route, f){

                    router.get(route, global.helpers.jwt.middleware, (req, res) => {

                        res.std(f(req.decoded, req.query))

                    })

                },

                post(route, f){

                    router.post(route, global.helpers.jwt.middleware, (req, res) => {

                        res.std(f(req.decoded, req.body))

                    })

                },

                put(route, f){

                    router.put(route, global.helpers.jwt.middleware, (req, res) => {

                        res.std(f(req.decoded, req.body))

                    })

                }

            }

        })

        // Caso a rota esteja prefixada
        if(typeof routeObj.route !== 'undefined'){

            // Router com prefixo
            app.use(routeObj.route, router)

        } else{

            // Router sem prefixo
            app.use(router)

        }

    })

    // Ignore cordova.js 404 error on browser environment
    app.get('cordova.js', (req, res) => res.send(''))

    app.all('*', (req, res) => {

        Logs.notFound(req)

        res.status(404).send('Not found')

    })

    global.modules.cl.init(process)

    Util.cl.setup(global.modules.cl)

})

server.listen(port, () => {

    console.log(`@info ${process.env.APP_NAME} listening on ${protocol}://${host}:${port}`)

    if (global.config.socket) {

        global.socket.setup(io)

    }

    fs.writeFile(path.join(global.dir.logs, 'last.pid'), process.pid, 'utf-8')

    if(global.helpers.f) global.helpers.f.checksum()

    if(global.app.onstartserver) global.app.onstartserver(app)

})