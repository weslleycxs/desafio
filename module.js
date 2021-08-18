let chokidar = require("chokidar")
let walkdir  = require("walkdir")
let path     = require('path')
let fs       = require('fs-extra')
let crc32    = require('crc').crc32
let sass     = require('sass')

let Util = require(global.dir.root + '/util.js');

require('colors');

module.exports = {

    specialPaths: ['views/page', 'views/public'],

    onload: function(){

        global.modules.cl.add("apply files", function(){

            return module.exports.reapplyFiles();

        });

        global.modules.cl.add("apply views", function(){

            Util.kugel.compileViews();

        });

        Util.kugel.compileViews();

        global.modules.cl.add("apply modules", () => {

            return module.exports.applyModules();

        }, 'Responsável por retornar arquivos para a pasta de módulos');

        let viewsWatcher = chokidar.watch(global.dir.views, {
            persistent: true
        });

        let assetsWatcher = chokidar.watch(global.dir.assets, {
            persistent: true
        });

        let modulesWatcher = chokidar.watch(global.dir.modules, {
            persistent: true
        });

        viewsWatcher.on('change', filePath => {

            module.exports.runChange(filePath);

        });

        assetsWatcher.on('change', filePath => {

            module.exports.runChange(filePath);

        });

        modulesWatcher.on('change', filePath => {

            module.exports.runChange(filePath);

        });

        return Promise.resolve(module.exports);

    },

    compile: {

        sass(filePath){

            return new Promise((resolve, reject) => {

                let outPath = filePath.replace('.scss', '.css');

                sass.render({

                    file: filePath,
                    outFile: outPath,

                }, function(error, result){

                    if(error) return reject(error);

                    fs.writeFile(outPath, result.css, function(err){

                        if(err) return reject(err);

                        resolve();

                    });

                });

            });

        }

    },

    async runChange(filePath){

        let extensionFile = path.extname(filePath);

        await module.exports.reapplyFiles();

        switch(extensionFile){
            case '.pug':

                global.modules.cl.execute('apply views');

            break;
            case '.sass':
            case '.scss':

                module.exports.compile.sass(filePath);

            break;
            case '.css':
            case '.js':

                // @todo Verificar alguma task na mudança dos assets

            break;
            default:
                // Arquivo não relevante foi alterado
            break;
        }

    },

    components: {},

    applyFilesFirstRun: {},

    // Move os arquivos públicos da pasta do módulo para a pasta app
    applyFiles(moduleName){

        let firstTime = false;

        if(!module.exports.applyFilesFirstRun[moduleName]){
            module.exports.applyFilesFirstRun[moduleName] = true;
            firstTime = true;
        }

        // Lista os arquivos públicos de determinado módulo
        return module.exports.listFiles(moduleName).then(files => {

            // Caso não tenha arquivos, ignora
            if(!Object.keys(files).length) return;

            let applyPromise = [];

            for(file in files){

                // Aqui, definimos onde cada arquivo será depositado
                let destinationFolder = global.dir[file];

                // @todo Pensar em fazer o mesmo para outros tipos de arquivo(routes, modules, etc)
                if(file == 'views'){

                    // No caso de views, preferimos que fique dentro de uma pasta
                    // chamada modules, por motivos de include no pug
                    destinationFolder = path.join(global.dir[file], 'modules', moduleName);

                    applyPromise.push(fs.ensureDirSync(destinationFolder));

                }

                if(file == 'views/page'){

                    destinationFolder = path.join(global.dir.views, 'page');

                }

                if(file == 'views/public'){

                    destinationFolder = path.join(global.dir.views, 'public');

                }

                // @todo Criar situação de verificar quando o file tanto não existe no sistema, quanto
                // não está em specialPaths
                // if(!module.exports.specialPaths.includes(file) && destinationFolder)

                files[file].forEach(asset => {

                    let absoluteFileSrc = asset.replace(path.join(global.dir.modules, moduleName, file), '');

                    let destinationFolderPath = path.join(destinationFolder, absoluteFileSrc);

                    applyPromise.push(fs.readFile(asset, 'utf-8').then(assetData => {

                        // Verifica se o arquivo já existe
                        let destinationPromise = fs.exists(destinationFolderPath).then(destinationExists => {

                            if(destinationExists) return fs.readFile(destinationFolderPath, 'utf-8');

                            return Math.random().toString();

                        });

                        // @todo Verificar como podemos forçar que após compilar um sass, possamos indexar o .css resultante
                        if((asset.substr(-5) === '.scss' || asset.substr(-5) === '.sass')){

                            if(firstTime){
                            
                                return module.exports.compile.sass(asset);

                            } else{

                                return;

                            }

                        }

                        return destinationPromise.then(destinationData => {

                            if(crc32(assetData) !== crc32(destinationData)){

                                return fs.copy(asset, destinationFolderPath, {
                                    overwrite: true
                                });

                            }

                        });

                    }));

                });

            }

            return Promise.all(applyPromise);

        });

    },

    // Verifica por @todo arquivos inexistentes, @todo pastas, e arquivos duplicados
    verifyModules(bootSteps){

        if(typeof process.env.MODULES_PATH == 'undefined'){

            console.log("@warn Defina a variável MODULES_PATH para instalação automática dos modulos");
            process.exit();

        }

        let errors = [];

        let modulesPromise = [];

        let includedModules = [];

        let uniqueFiles = {};

        for(step in bootSteps){

            let modules = bootSteps[step];

            modules.forEach(moduleName => {

                if(includedModules.includes(moduleName)){

                    errors.push("O módulo " + moduleName + " já foi incluído");

                }

                includedModules.push(moduleName);

                let moduleRepoPath = path.join(process.env.MODULES_PATH, moduleName);

                if(!fs.existsSync(moduleRepoPath) && process.env.MODULES_CHECK_REPO !== "false"){

                    return errors.push(moduleName + " não encontrado em MODULES_PATH");

                }

                modulesPromise.push(Util.tree(moduleRepoPath).then(files => {

                    files.forEach(file => {

                        if(file == '/package.json'){

                            let package      = fs.readJsonSync(path.join(moduleRepoPath, 'package.json'));
                            let mainFileName = package.main.substr(0, package.main.length - 3);

                            if(package.name !== moduleName){

                                errors.push(`O nome do modulo deve ser identico ao .name no package.json (${package.name} != ${moduleName})`);

                            }

                            if(!package.main) errors.push(`A propriedade .main é obrigatória no package.json (${moduleName})`);
                            else{

                                if(mainFileName !== moduleName){

                                    errors.push(`O arquivo em .main no package.json deve ser igual ao nome do módulo (${mainFileName} != ${moduleName})`);

                                }

                            }

                            return;

                        }

                        if(typeof uniqueFiles[file] == 'undefined'){

                            uniqueFiles[file] = [];

                        }

                        uniqueFiles[file].push(moduleName);

                    });

                }));

            });

        }

        return Promise.all(modulesPromise).then(() => {

            for(file in uniqueFiles){

                if(uniqueFiles[file].length > 1){

                    errors.push(`Arquivo encontrado ${uniqueFiles[file].length} vezes nos módulos: ${uniqueFiles[file].join(', ').green} -> ${file.green}`);

                }

            }

            if(errors.length){

                module.exports.showInitializationFatalErrors(errors);

            }

            return Promise.resolve();

        });

    },

    showInitializationFatalErrors(errors){

        if(process.env.MODULES_PATH === "false") return console.log("@info Ignorando erros de módulos");
        
        console.log("@error".red + " erros durante a inicialização: ");

        errors.forEach((error, k) => {

            console.log(++k + ". " + error);

        });

        console.log(`@info Pasta usada ${process.env.MODULES_PATH}`);

        process.exit();

    },

    // Remove os arquivos públicos do módulo para na pasta app
    delFiles(moduleName){

        // @todo o mesmo que applyFiles, só que ao invés de .cp, será .del ou unlink

    },

    listFiles(moduleName){

        let moduleObj = global.modules[moduleName];

        if(!moduleObj){
            return global.logs.save('undefined moduleObj', {moduleName: moduleName});
        }

        let files = {};

        let filesPromise = [];

        if(moduleObj.files){

            for(file in moduleObj.files){

                // Vamos ignorar tudo que não está em dir, pois tanto faz parte da lógica
                // quanto precisamos limitar por segurança
                if(typeof global.dir[file] === 'undefined' && !module.exports.specialPaths.includes(file)){

                    console.log(`@info Propriedade ${file} de .files ignorada, por não existir dentro de app (${moduleName})`)

                    continue;

                }

                filesPromise.push(new Promise((resolve, reject) => {

                    let filePath = path.join(global.dir.modules, moduleName, file);

                    let thatFile = file;

                    let walk = walkdir(filePath);

                    walk.on('file', (asset) => {

                        if(!files[thatFile]) files[thatFile] = [];

                        files[thatFile].push(asset);

                    });

                    walk.on('end', resolve);

                }));

            }

        }

        return Promise.all(filesPromise).then(() => {

            return files;

        });

    },

    installModule(moduleName){

        console.log('@info'.green, moduleName, 'instalando');

        let modulePath = path.join(global.dir.modules, moduleName);

        if(typeof process.env.MODULES_PATH == 'undefined'){

            console.log("@warn Defina a variável MODULES_PATH para instalação automática dos modulos");
            process.exit();

        }

        let moduleRepoPath = path.join(process.env.MODULES_PATH, moduleName);

        if(!fs.existsSync(moduleRepoPath)){

            console.log(`@warn Modulo ${moduleName} não encontrado`);
            process.exit();

        }

        fs.copySync(moduleRepoPath, modulePath);

        console.log('@info'.green, moduleName, 'instalado');

    },

    loadModules(modules, modulesType){

        let modulePromises = [];

        modules.forEach(async moduleName => {

            let modulePath = path.join(global.dir.modules, moduleName);

            let moduleExists = fs.existsSync(modulePath);

            if(!moduleExists){

                module.exports.installModule(moduleName);

            }

            modulePromises.push(new Promise((resolve, reject) => {

                // @todo Verificar necessidade de garantir que não exista nada anteriormente
                // associado a essa variavel
                let moduleInstance = require(modulePath);

                if(moduleInstance.files){

                    let errors = [];

                    for(file in moduleInstance.files){

                        if(!fs.existsSync(path.join(modulePath, file))){

                            errors.push(`A pasta ${file} não existe dentro do módulo ${moduleName}`);

                        }

                    }

                    if(errors.length) return module.exports.showInitializationFatalErrors(errors);

                }

                let commonPromise = () => {};

                if(moduleInstance.then){

                    global.modules[moduleName] = {

                        onload: new Promise((resolve2, reject) => {
                            commonPromise = resolve2
                        })

                    }

                    return moduleInstance.then(moduleObj => {

                        if(!moduleObj){
                            console.log(`@warn modulo ${moduleName} sem objeto de retorno`)
                            moduleObj = {}
                        }

                        global.modules[moduleName] = moduleObj; 

                        commonPromise(global.modules[moduleName])

                    }).then(() => {

                        resolve()

                    });

                } else{

                    global.modules[moduleName] = moduleInstance;

                    process.env[moduleName.replace('-', '_') + '_MODULE_PATH'] = __dirname;

                    console.log(`${"@module".yellow} Carregando módulo ${moduleName.red}`);

                    return module.exports.applyFiles(moduleName).then(resolve);

                }

            }).then(() => {

                if(global.modules[moduleName]){

                    return module.exports.applyFiles(moduleName);

                }

            }));

        });

        return Promise.all(modulePromises).then(() => {

            console.log(`${"@module".yellow} ${modules.length} modulos ${modulesType.red} carregados`);

        });

    },

    applyModules(){

        let modulesApp    = fs.readdirSync(global.dir.modules);
        let modulesOrigin = fs.readdirSync(process.env.MODULES_PATH);

        modulesApp.forEach(mod => {

            let modulePath = path.join(global.dir.modules, mod);

            if(!modulesOrigin.includes(mod)){

                return fs.copy(modulePath, path.join(process.env.MODULES_PATH, mod)).then(() => {

                    console.log(`@info Adicionando o módulo ${mod} na pasta env.MODULES_PATH`);

                });

            }

            Util.tree(modulePath).then(tree => {

                tree.forEach(async file => {

                    let moduleFilePath       = path.join(modulePath, file);
                    let moduleOriginFilePath = path.join(process.env.MODULES_PATH, mod, file);

                    // Se for um arquivo css
                    if(moduleFilePath.substr(-4) == '.css'){

                        // E já existir um .scss ou .sass, não vamos mandar a pasta original
                        if(fs.existsSync(moduleFilePath.replace('.css', '.scss')) || fs.existsSync(moduleFilePath.replace('.css', '.sass'))){

                            return;

                        }

                    }

                    if(await Util.crc32(moduleFilePath) != await Util.crc32(moduleOriginFilePath)){

                        fs.copy(moduleFilePath, moduleOriginFilePath, {
                            overwrite: true
                        }).then(() => {

                            console.log(`@info Arquivo ${file.green} do modulo ${mod.green} aplicado com sucesso`);

                        }).catch(e => {

                            console.log(`@err Ocorreu um erro ${e.toString()}`);

                        });

                    }

                });

            });

        });

    },

    reapplyFiles(){

        let applyPromise = [];

        for(moduleName in global.modules){

            applyPromise.push(module.exports.applyFiles(moduleName));

        }

        return Promise.all(applyPromise).then(() => {

            return global.helpers.f.checksum();

        });

    },

    addToComponent(component, obj){

        component = component.toLowerCase();

        // Caso este componente não esteja declarado, vamos declara-lo
        if(typeof module.exports.components[component] == 'undefined'){

            module.exports.components[component] = {
                stack: []
            }

        }

        // @todo Procurar um jeito melhor de definir ser um array
        if(obj instanceof Array){

            obj.forEach(item => {

                module.exports.components[component].stack.push(item);

            });

        } else{

            module.exports.components[component].stack.push(obj);

        }

    },

    getComponentStack(component){

        if(!module.exports.components[component]){

            console.log(`@warn O componente ${component} não está definido`);

            return [];
        }

        return module.exports.components[component].stack;

    }

}