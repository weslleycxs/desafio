#!/usr/bin/env node

const database = require('./database.js');
const path     = require('path');
const uuid     = require('uuid').v1;

let argv = process.argv;

let args = [];

argv.forEach((arg, k) => {

    if(k <= 1) return;

    args.push(arg);

});

let json = database.excelToJson(path.resolve(process.cwd(), args[0]));

json.forEach(data => {

    let insightId = uuid();

    if(!data.tag) data.tag = '';

    let insight = {
        text: data.text,
        tag: data.tag.split(';'),
        insightId: insightId
    }

    database.setCache('insight', insightId, insight);

});

console.log(`${json.length} insights foram salvos`);