var startedAt = new Date()

console.log('@starting Iniciando 1/7 ' + startedAt.getHours() + 'h' + startedAt.getMinutes() + 'm' + startedAt.getSeconds() + 's (' + startedAt.getTime() + ')')

// Versão mínima da plataforma node que o sistema roda
var minNodeVersion = 7

// Inicia o sistema, vamos verificar a estrutura de pastas atuais
require('fs').readdir(__dirname, function(err, files){

    console.log('@starting Iniciando 2/7 (Analisando sistema local)')

    if(err) return console.error("KUGEL FATAL READ PERMISSION ERROR")

    var haveNodeModules = false
    var haveGit         = false
    var haveKugel       = false
    var haveOpenAPI     = false
    var havePackageJson = false

    var nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1])

    console.log('@starting Iniciando 3/7 (Dependencias e recomendações)')

    files.forEach(function(file){

        if(file === 'node_modules') haveNodeModules = true
        if(file === '.git')         haveGit         = true
        if(file === 'kugel.js')     haveKugel       = true
        if(file === 'openapi.yaml') haveOpenAPI     = true
        if(file === 'package.json') havePackageJson = true

    })

    if(!haveGit){

        console.warn("\n@warning Fora de um projeto git")

    }

    if(!haveKugel){

        console.warn("\n@warning Fora de um projeto Kugel")
        
    }

    if(nodeVersion < 7){

        console.log("\n@warning Versão node incompatível(v" + nodeVersion + "), atualize para 7 ou superior.")

    }

    if(!haveOpenAPI){

        console.log("\n@warning Não foi encontrado um arquivo de definição OpenAPI (openapi.yaml)")

    }

    if(!haveNodeModules){

        console.log("\n@error Instale as dependências: npm install\n")
        process.exit()

    }

    if(!havePackageJson){

        console.log("\n@fatal Deve possuir o arquivo package.json\n")
        process.exit()

    }

    global.package = require('./package.json')

    if(typeof global.package.kugel == 'undefined'){

        console.log("@fatal O package.json deve possuir a propriedade kugel")
        process.exit()

    }

    console.log('@starting Iniciando 4/7 (module)')

    // Load the env variables from .env file
    require('dotenv').config({path: __dirname + '/.env'})

    global.modules = {}

    var fs    = require('fs-extra')
    var path  = require('path')

    var kugel

    global.app = require('./app')

    console.log('Iniciando 5/7')

    // Global constants
    global.dir = {}

    global.vars       = {}
    global.helpers    = {}
    global.controller = {}

    global.dir.root        = __dirname
    global.dir.logs        = path.join(global.dir.root, '.logs')
    global.dir.app         = path.join(global.dir.root, 'app')
    global.dir.doc         = path.join(global.dir.root, 'doc')
    global.dir.modules     = path.join(global.dir.root, 'modules')

    if(global.package.kugel.config.assets){

        global.dir.assets = path.join(global.dir.app, global.package.kugel.config.assets)

    }

    if(global.package.kugel.config.views){

        global.dir.views = path.join(global.dir.app, global.package.kugel.config.views)

    }

    global.dir.models      = path.join(global.dir.app,  'models')
    global.dir.storage     = path.join(global.dir.app,  'storage')

    global.dir.helpers     = path.join(global.dir.app,  'helpers')
    global.dir.routes      = path.join(global.dir.app,  'routes')
    global.dir.controllers = path.join(global.dir.app,  'controllers')
    global.dir.data        = path.join(global.dir.app,  'data')

    global.modules.module = require('./module.js')

    if(!global.package.kugel.modules)            global.package.kugel.modules            = []
    if(!global.package.kugel.modules.core)       global.package.kugel.modules.core       = []
    if(!global.package.kugel.modules.startup)    global.package.kugel.modules.startup    = []
    if(!global.package.kugel.modules.lightstart) global.package.kugel.modules.lightstart = []
    if(!global.package.kugel.modules.start)      global.package.kugel.modules.start      = []

    return global.modules.module.verifyModules(global.package.kugel.modules).then(() => {

        return global.modules.module.loadModules(global.package.kugel.modules.core, 'core');

    }).then(() => {

        console.log('Iniciando 6/7 (Kugel)')

        kugel = require('./kugel')

        return global.modules.module.loadModules(global.package.kugel.modules.startup, 'startup')

    }).then(function(){

        return global.modules.module.loadModules(global.package.kugel.modules.lightstart, 'lightstart')

    }).then(function(){

        if(typeof kugel.lightstart !== 'undefined'){

            return kugel.lightstart(() => {

                console.log('Iniciando 7/7')

                return global.modules.module.loadModules(global.package.kugel.modules.start, 'start')

            })

        }

    }).then(global.modules.module.onload).then(() => {

        if(typeof kugel.finalstart !== 'undefined'){

            return kugel.finalstart(() => {

                var at = new Date()

                console.log("\n" + '@started'.white.bgGreen + ' at ' + at.getHours() + 'h' + at.getMinutes() + 'm' + at.getSeconds() + 's (' + at.getTime() + ")\n")

            });

        }

    });

})
