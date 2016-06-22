#!/usr/bin/env node

var program = require('commander');
var chalk = require('chalk');
var fs = require('fs');
var node_path=require('path');
var _rev=require("./index.js");


var readJson = function(path){
    if(!fs.existsSync(path)){
        return false;
    }
    var t = fs.readFileSync(path);
    return eval('('+ t +')');
};
function cloneObj(oldObj) {
    if (typeof(oldObj) != 'object') return oldObj;
        if (oldObj == null) return oldObj;
            var newObj = new Object();
        for (var i in oldObj)
            newObj[i] = cloneObj(oldObj[i]);
    return newObj;
};
function extendObj() {
    var args = arguments;
    if (args.length < 2) return;
    var temp = cloneObj(args[0]);
    for (var n = 1; n < args.length; n++) {
        for (var i in args[n]) {
            temp[i] = args[n][i];
        }
    }
    return temp;
}
var defaults={
    
};
program
    .version('1.0.0')
    .option('-v, --release [release]', 'release')
    // .option('-r, --root [root]', 'relative path to the cwd folder')
    .parse(process.argv);

/**
 * Error Handling io
 */
var _configs=readJson("rev.json");

var options={}
options=_configs?extendObj(defaults,_configs):defaults;

if(program.release){
   options.version= program.release;
}

_rev(options);