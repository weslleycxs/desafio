const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

const Logs = require('./logs');

var Database = {

    slowDelay: 5000,

    util: {

        getTableData(sql){

            let obj = {
                table: '',
                columns: {},
                indexes: []
            };

            let lines = sql.split("\n");

            lines.forEach((line, n) => {

                line = line.trim();

                if(n === 0){

                    return obj.table = line.replace("CREATE TABLE `", "").replace("` (", "");

                }

                if(line == ");") return;

                let columns = line.split(' ');

                let columnName = columns[0].replace(/`/g, '');

                if(columnName === 'UNIQUE'){
                    return obj.indexes.push(line);
                }

                obj.columns[columnName] = line.replace(',', '').replace(`\`${columnName}\` `, '');

            });

            return obj;

        }

    },

    getTableSize(tableName){

        return global.db.con().then(con => {

            return con.readQuery(`SELECT TABLE_NAME, DATA_LENGTH + INDEX_LENGTH AS \`bytes\` FROM information_schema.TABLES WHERE TABLE_SCHEMA = "${process.env.MYSQL_DB}" AND TABLE_NAME = '${tableName}' LIMIT 1`).then(tableSize => {

                return tableSize.bytes;

            });

        });

    },

    // Lista todas as tabelas da conexão principal do banco de dados
    getTables(){

        return global.db.con().then(con => {

            return con.fetch("SHOW TABLES").then(tablesInDb => {

                let tables = [];

                tablesInDb.forEach(table => {

                    let tableName = table['Tables_in_' + process.env.MYSQL_DB];

                    tables.push(tableName);

                });

                return tables;

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    countRows(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return con.readQuery("SELECT COUNT(*) as c FROM " + tableName + " LIMIT 1").then(count => {

                return count.c;

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    minId(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MIN(id) as id FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.id);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    maxId(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MAX(id) as id FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.id);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    minCreated(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MIN(created_at) as created_at FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.created_at);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    maxCreated(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MAX(created_at) as created_at FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.created_at);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    minUpdated(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MIN(updated_at) as updated_at FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.updated_at);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Conta a quantidade de linhas de uma tabela
    maxUpdated(tableName){

        return global.db.con().then(con => {

            // @todo Colocar verificação de tabelas, para impedir que a função seja usada
            // por sql injection, apesar de ser uma função interna

            return new Promise((resolve, reject) => {

                return con.readQueryWithoutLogs("SELECT MAX(updated_at) as updated_at FROM " + tableName + " LIMIT 1").then(row => {

                    resolve(row.updated_at);

                }).catch(e => {

                    resolve(false);

                });

            });

        });

    },

    // Pega uma n quantidade de linhas aleatórias de determinada tabela
    randomRows(tableName, limit = 3){

        // Se sim, oculta informações potencialmente sensíveis
        const deleteLogin = true;

        return global.db.con().then(con => {

            return con.fetch("SELECT * FROM " + tableName + " ORDER BY RAND() LIMIT ?", [limit]).then(rows => {

                if(deleteLogin){

                    rows.forEach(row => {

                        // Deleta um conjunto de palavras chave que geralmente guardam informação
                        // sensível
                        delete row.pass;
                        delete row.password;
                        delete row.login;
                        delete row.user;
                        delete row.email;
                        delete row.mail;

                    });

                }

                return rows;

            });

        });

    },

    saveReport(){

        console.log('@warn Saving report');

        let report = {};

        report.db  = process.env.MYSQL_DB;
        report.con = process.env.MYSQL_USER + '@' + process.env.MYSQL_HOST;
        report.at  = new Date().getTime();

        return Database.getTables().then(tables => {

            report.tables = {};

            let tablePromises = [];

            tables.forEach(table => {

                report.tables[table] = {};

                tablePromises.push(Database.countRows(table).then(count => {

                    report.tables[table].length = count;

                    return Database.randomRows(table);

                }).then(rows => {

                    if(rows.length){

                        report.tables[table].randRows = rows;

                    }

                    return Database.maxId(table);

                }).then(maxId => {

                    if(typeof maxId == 'number'){

                        report.tables[table].maxId = maxId;

                    }

                    return Database.minId(table);

                }).then(minId => {

                    if(typeof minId == 'number'){

                        report.tables[table].minId = minId;

                    }

                    return Database.minCreated(table);

                }).then(minCreated => {

                    if(typeof minCreated == 'number'){

                        report.tables[table].minCreated = minCreated;

                    }

                    return Database.maxCreated(table);

                }).then(maxCreated => {

                    if(typeof maxCreated == 'number'){

                        report.tables[table].maxCreated = maxCreated;

                    }

                    return Database.minUpdated(table);

                }).then(minUpdated => {

                    if(typeof minUpdated == 'number'){

                        report.tables[table].minUpdated = minUpdated;

                    }

                    return Database.maxUpdated(table);

                }).then(maxUpdated => {

                    if(typeof maxUpdated == 'number'){

                        report.tables[table].maxUpdated = maxUpdated;

                    }

                    return Database.getTableSize(table);

                }).then(bytes => {

                    report.tables[table].bytes = bytes;

                }));

            });

            return Promise.all(tablePromises).then(() => {

                Logs.save('database report', report);

                return report;

            });

        });

    },

    getBaseObj: function(sql){

        let obj = {};

        let reg = /CREATE\sTABLE \`[a-zA-Z_0-9]+\`\s\((.|\n)*?\);\n/g;

        let founds = sql.match(reg);

        founds.forEach((found, k) => {

            let tableSql = found.trim();

            let tableData = Database.util.getTableData(tableSql);

            tableData.sql = tableSql;

            obj[tableData.table] = tableData;

        });

        return obj;

    },

    compareStructure: function(){

        let oldSqlPath = path.join(global.dir.doc, 'generated-files', 'structure.sql');

        fs.exists(oldSqlPath).then(exists => {

            if(!exists){

                console.log("Não há como compararmos o banco de dados se o arquivo doc/generated-files/structure.sql inexistir.");
                console.log("Use o comando " + 'backup structure'.green + ' para gera-lo.');

                return;

            }

            fs.readFile(oldSqlPath, 'utf-8').then(oldSql => {

                let migrateSql = "";
                let createSql  = "";

                Database.backupStructure(newSql => {

                    let oldBase = Database.getBaseObj(oldSql);
                    let newBase = Database.getBaseObj(newSql);

                    Object.keys(oldBase).forEach((tableName, k) => {

                        if(typeof newBase[tableName] === 'undefined'){

                            console.log(`${tableName.red} não existe no banco novo.`);

                            createSql += oldBase[tableName].sql + "\n\n";

                        }

                    });

                    Object.keys(newBase).forEach((tableName, k) => {

                        if(typeof oldBase[tableName] === 'undefined'){

                            console.log(`${tableName.red} não existe no banco antigo.`);

                        } else{

                            var columnsFound = [];

                            Object.keys(newBase[tableName].columns).forEach(column => {

                                if(!columnsFound.includes(column)){
                                    columnsFound.push(column);
                                }

                            });

                            Object.keys(oldBase[tableName].columns).forEach(column => {

                                if(!columnsFound.includes(column)){
                                    columnsFound.push(column);
                                }

                            });

                            columnsFound.forEach(column => {

                                var oldColumn = oldBase[tableName].columns[column];
                                var newColumn = newBase[tableName].columns[column];

                                if(typeof oldColumn === 'undefined'){

                                    return console.log(`${tableName.magenta}.${column.green} não existe no banco antigo.`);

                                }

                                if(typeof newColumn === 'undefined'){

                                    migrateSql += `ALTER TABLE \`${tableName}\` ADD \`${column}\` ${oldColumn};\n`;

                                    return console.log(`${tableName.magenta}.${column.green} não existe no banco novo.`);

                                }

                                if(oldColumn != newColumn){

                                    migrateSql += `ALTER TABLE \`${tableName}\` CHANGE \`${column}\` \`${column}\` ${oldColumn};\n`;

                                    console.log(tableName.magenta + '.' + column.green + ' está diferente.');

                                }

                            });

                        }

                    });

                    if(migrateSql){

                        console.log('Para atualizar as colunas do banco atual com o do repositório:');
                        console.log(migrateSql);

                    }

                    if(createSql){

                        console.log('Para criar as tabelas no atual:');
                        console.log(createSql);

                    }

                });

            });

        });

    },

    backupStructure: function(callback){

        return global.db.fetch("SHOW TABLES").then(tables => {

            let tableNames = [];
            let finalStructure = "-- Generated on " + new Date().toLocaleString() + "\n\n";

            tables.forEach(tableInDb => {

                tableNames.push(tableInDb[Object.keys(tableInDb)[0]]);

            });

            let showCreateTablesPromise = [];

            tableNames.forEach((table, k) => {

                showCreateTablesPromise.push(global.db.internalQuery("SHOW CREATE TABLE " + table).then(result => {

                    var tableStructure = Database.parseTableStructure(result['Create Table']);

                    var prefix = "\n\n";

                    if(k === 0) prefix = "";

                    finalStructure += prefix + tableStructure;

                }))

            });

            return Promise.all(showCreateTablesPromise).then(function(){

                if(typeof callback !== 'undefined'){

                    callback(finalStructure);

                } else{
                    
                    return fs.writeFile(path.join(global.dir.doc, 'generated-files', 'structure.sql'), finalStructure, 'utf-8').then(() => {

                        console.log('Backup realizado com sucesso');

                    });

                }


            });

        });

    },

    parseTableStructure: function(str){

        str = str.split(" ENGINE=")[0];

        str = str + ";";

        return str;

    },

    installGeneratedStructure(){

        let structurePath = path.join(global.dir.doc, 'generated-files', 'structure.sql');

        fs.exists(structurePath).then(exist => {

            if(!exist){

                return console.log('@warn Arquivo de estrutura de banco de dados inexistente');

            } else{

                console.log('@warn Criando estrutura de banco de dados');

                cp.exec(`mysql -h ${process.env.MYSQL_HOST} -u ${process.env.MYSQL_USER} -p${process.env.MYSQL_PASS} ${process.env.MYSQL_DB} < ${structurePath}`);

            }

        });

    },

    checkForStructureInstall(){

        global.db.fetch("SHOW TABLES;").then(rows => {

            if(rows.length == 0){

                Database.installGeneratedStructure();

            }

        });

    },

    getMysql: function(){

        var mysql  = require('mysql');

        // @deprecated devido ao pool abaixo, que está em testes
        var client = mysql.createConnection({
            acquireTimeout: 1000000,
            host          : process.env.MYSQL_HOST,
            user          : process.env.MYSQL_USER,
            password      : process.env.MYSQL_PASS,
            database      : process.env.MYSQL_DB
        });

        var pool = mysql.createPool({
            connectionLimit : 12,
            host            : process.env.MYSQL_HOST,
            user            : process.env.MYSQL_USER,
            password        : process.env.MYSQL_PASS,
            database        : process.env.MYSQL_DB
        });

        client.connect( err => {
            if(err) throw err;
            else{

                console.log("@info Conexão mysql bem sucedida!");

                Database.checkForStructureInstall();

                // Database.saveReport();

                // Isso impede o erro de grupos
                // client.query("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

            }
        });

        // Mantém a conexão ativa, fazendo uma querry a cada 10 segundos
        setInterval( () => {
            client.query("SELECT 1");
        }, 10000);

        // Salva um relatório a cada hora
        setInterval(Database.saveReport, 1000 * 60 * 60);

        // Retorna apenas a primeira ROW
        client.readQuery = (sql, prepared) => {

            return new Promise(function(resolve, reject){

                // Mostra um aviso, caso a query não tenha limit 1 no final
                if(sql.substr(-7).toLowerCase()!='limit 1'){
                    console.warn("Database.js: read Query sem limit 1");
                }

                // Executa a query
                client.query(sql, prepared, (err, answer) => {

                    if(err){

                        Logs.save('database-read-query', {
                            err: err,
                            prepared: prepared,
                            sql: sql
                        }, 20);

                        reject(err);

                    } else(resolve(answer[0]));

                });

            });

        };

        // Retorna apenas a primeira ROW
        client.readQueryWithoutLogs = (sql, prepared) => {

            return new Promise(function(resolve, reject){

                // Mostra um aviso, caso a query não tenha limit 1 no final
                if(sql.substr(-7).toLowerCase()!='limit 1'){
                    console.warn("Database.js: read Query sem limit 1");
                }

                // Executa a query
                client.query(sql, prepared, (err, answer) => {

                    if(err){

                        reject(err);

                    } else(resolve(answer[0]));

                });

            });

        };

        // Retorna apenas a primeira ROW
        client.internalQuery = (sql, prepared) => {

            if(process.env.VERBOSE == "true") console.log(sql.magenta);

            return new Promise(function(resolve, reject){

                // Executa a query
                client.query(sql, prepared, (err, answer) => {

                    if(err){

                        Logs.save('database-internal-query', {
                            err: err,
                            sql: sql,
                            prepared: prepared
                        }, 20);

                        reject(err);

                    } else(resolve(answer[0]));

                });

            });

        };

        // Retorna apenas a primeira ROW
        client.updateQuery = (sql, prepared) => {

            let t0 = new Date().getTime();
            let slowQuery = false;

            let slowTimeout = setTimeout(function(){

                slowQuery = true;

            }, Database.slowDelay);

            prepared = prepared || [];

            return new Promise(function(resolve, reject){

                // Executa a query
                client.query(sql, prepared, (err,result) => {

                    if(err){

                        Logs.save('database-update-query', {
                            err: err,
                            sql: sql,
                            prepared: prepared
                        }, 20);

                        return reject(err.toString());

                    }

                    if(process.env.VERBOSE == "true") console.log(sql.magenta, new Date().getTime() - t0, `ms (uq:${client.threadId})`.green);

                    clearTimeout(slowTimeout);

                    if(slowQuery){

                        Logs.save('slow query', {
                            sql: sql,
                            prepared: prepared,
                            delay: new Date().getTime() - t0
                        });

                    }
                    
                    result.id = result.insertedId;
                    resolve(result);

                });

            });

        };

        // Retorna a lista de rows
        client.fetch = function(sql, prepared, callback){

            let t0 = new Date().getTime();
            let slowQuery = false;

            let slowTimeout = setTimeout(function(){

                slowQuery = true;

            }, Database.slowDelay);

            return new Promise((resolve, reject) => {

                client.query(sql, prepared, (err, answer) => {

                    if(err){

                        Logs.save('database-fetch-query', {
                            err: err,
                            sql: sql,
                            prepared: prepared
                        }, 20);

                        reject(err);

                    } else{

                        resolve(answer);

                    }

                    if(process.env.VERBOSE == "true") console.log(sql.magenta, new Date().getTime() - t0, `ms (f:${client.threadId})`.green);

                    clearTimeout(slowTimeout);

                    if(slowQuery){

                        Logs.save('slow query', {
                            sql: sql,
                            prepared: prepared,
                            delay: new Date().getTime() - t0
                        });

                    }

                });

            });

        };

        client.uuid = function(){
            return new Promise((resolve, reject) => {

                client.readQuery(`SELECT UUID() as uuid LIMIT 1`).then(uuid => {
                    resolve(uuid.uuid);
                }).catch(reject);

            });
        }

        client.raw = client.query;

        client.prepared    = '?';

        function doBackup(versionName){

            var version = versionName || 'latest';

            version = version.replace(/\(/g, '');
            version = version.replace(/\)/g, '');
            version = version.replace(/\s/g, '_');

            console.log("Realizando Backup", version);

            cp.exec("mysqldump -u " + process.env.MYSQL_USER + " --password=\"" + process.env.MYSQL_PASS + "\" " + process.env.MYSQL_DB + " > .sql/" + version + ".sql");
            
            if(versionName){

                cp.exec("mysqldump -u " + process.env.MYSQL_USER + " --password=\"" + process.env.MYSQL_PASS + "\" " + process.env.MYSQL_DB + " > .sql/latest.sql");

            }

        }

        client.con = () => {

            let poolClient = {}

            // Retorna apenas a primeira ROW
            poolClient.readQuery = (sql, prepared) => {

                if(process.env.VERBOSE == "true") console.log(sql.magenta);

                let t0 = new Date().getTime();
                let slowQuery = false;

                let slowTimeout = setTimeout(function(){

                    slowQuery = true;

                }, Database.slowDelay);

                return new Promise(function(resolve, reject){

                    // Mostra um aviso, caso a query não tenha limit 1 no final
                    if(sql.substr(-7).toLowerCase()!='limit 1'){
                        console.warn("Database.js: read Query sem limit 1");
                    }

                    // Executa a query
                    pool.query(sql, prepared, (err, answer) => {

                        if(err){

                            Logs.save('database-read-query', {
                                err: err,
                                sql: sql,
                                prepared: prepared
                            }, 20);

                            reject(err);

                        } else(resolve(answer[0]));

                        if(process.env.VERBOSE == "true") console.log(sql.magenta, prepared, new Date().getTime() - t0, `ms (uq:${client.threadId})`.blue);

                        clearTimeout(slowTimeout);

                        if(slowQuery){

                            Logs.save('slow query', {
                                sql: sql,
                                prepared: prepared,
                                delay: new Date().getTime() - t0
                            });

                        }

                    });

                });

            };

            // Retorna apenas a primeira ROW
            poolClient.readQueryWithoutLogs = (sql, prepared) => {

                if(process.env.VERBOSE == "true") console.log(sql.magenta);

                return new Promise(function(resolve, reject){

                    // Mostra um aviso, caso a query não tenha limit 1 no final
                    if(sql.substr(-7).toLowerCase()!='limit 1'){
                        console.warn("Database.js: read Query sem limit 1");
                    }

                    // Executa a query
                    pool.query(sql, prepared, (err, answer) => {

                        if(err){

                            reject(err);

                        } else(resolve(answer[0]));

                    });

                });

            };

            // Retorna apenas a primeira ROW
            poolClient.updateQuery = (sql, prepared) => {

                let t0 = new Date().getTime();
                let slowQuery = false;

                let slowTimeout = setTimeout(function(){

                    slowQuery = true;

                }, Database.slowDelay);

                prepared = prepared || [];

                return new Promise(function(resolve, reject){

                    // Executa a query
                    pool.getConnection((err, conn) => {

                        if(err) throw err;

                        conn.query(sql, prepared, (err, result) => {

                            if(err){

                                Logs.save('database-update-query', {
                                    err: err,
                                    sql: sql,
                                    prepared: prepared
                                }, 20);

                                return reject(err);

                            }

                            if(process.env.VERBOSE == "true") console.log(sql.magenta, prepared, new Date().getTime() - t0, `ms (uq:${client.threadId})`.blue);

                            conn.release();

                            result.id = result.insertedId;

                            resolve(result);

                            clearTimeout(slowTimeout);

                            if(slowQuery){

                                Logs.save('slow query', {
                                    sql: sql,
                                    prepared: prepared,
                                    delay: new Date().getTime() - t0
                                });

                            }

                        });

                    });

                });

            };

            // Retorna a lista de rows
            poolClient.fetch = function(sql, prepared, callback){

                let t0 = new Date().getTime();
                let slowQuery = false;

                let slowTimeout = setTimeout(function(){

                    slowQuery = true;

                }, Database.slowDelay);

                return new Promise((resolve, reject) => {

                    pool.getConnection((err, conn) => {

                        if(err) throw err;

                        conn.query(sql, prepared, (err, answer) => {

                            if(err){

                                Logs.save('database-fetch-query', {
                                    err: err,
                                    sql: sql,
                                    prepared: prepared
                                }, 20);

                                reject(err);

                            } else{

                                resolve(answer);

                            }

                            conn.release();

                            if(process.env.VERBOSE == "true") console.log(sql.magenta, prepared, new Date().getTime() - t0, `ms (f:${conn.threadId})`.blue);

                            clearTimeout(slowTimeout);

                            if(slowQuery){

                                Logs.save('slow query', {
                                    sql: sql,
                                    prepared: prepared,
                                    delay: new Date().getTime() - t0
                                });

                            }

                        });

                    });

                });

            };

            poolClient.uuid = function(){
                return new Promise((resolve, reject) => {

                    pool.readQuery(`SELECT UUID() as uuid LIMIT 1`).then(uuid => {
                        resolve(uuid.uuid);
                    }).catch(reject);

                });
            }

            return Promise.resolve(poolClient);

        }

        client.con().then(con => {
        
            client.pool = con;

        });


        return client;

    }

}

// Baseado no .env, escolhe a engine
module.exports = Database.getMysql();

global.app.onload(async () => {

    global.modules.cl.add('backup structure', () => {

        Database.backupStructure();

    });

    global.modules.cl.add('bs', () => {

        Database.backupStructure();

    });

    global.modules.cl.add('compare database structure', () => {

        Database.compareStructure();

    });

    global.modules.cl.add('cds', () => {

        Database.compareStructure();

    });

});
