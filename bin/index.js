const fs = require("fs");
const node_path = require("path");
const md5 = require('md5');
const chalk = require('chalk');
const dirReplace = new require('./replace')();


var rev = function (_file,build,_type,_isRep,option) {
	"use strict";
    var version=option.version,publicPath=option.public,sourceMap=option.sourceMap,cwd=option.cwd,_filter=option.filter.join("|"),_bool=true,blockingQueue=option.blockingQueue;
    var regs={
        cssRegExp:new RegExp('(^|)\\s*url\\s*\\(\\s*["|\']?\\s*[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@!]*\\.('+option.extsReg+')(?![\\\\?|#])\\s*["|\']?\\s*[\\)]','gi'),
        htmlRegExp:new RegExp('(^|)\\s*('+_filter+')\\s*=\\s*\\\\?["|\']?\\s*[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@!]*\\.('+option.extsReg+')(?![\\?|#])\\s*\\\\?["|\'|\\/>|>|\\s]','gi'),
    }
    var appConfig = {
        // picRegExp: /["|'].*.["|']/gi,
        picRepRxp:new RegExp('('+_filter+'|url|\\(|\\)|=|\\\\|"|\'|\\s*)','gi'),
        httpRegExp: /^((https|http|ftp|rtsp|mms)?:?\/\/)[^\s]+/
    };
    // /(^|)\s*(src|href)\s*=\s*\\?["|']?\s*[0-9a-zA-Z+\-*%/\\<>.,;:_&^%$#@!]*\.(css|js|jpg|gif|bmp|png|webp|svg|eot|woff|ttf)(?![\?|#])\s*\\?["|'|\/>|>|\s]/gi
    // 处理 publicPath.
    publicPath = publicPath || "";

    if(!fs.existsSync(_file)){
       console.error(_file+" can not find the file."); 
        return;
    }
    var _filePath = node_path.dirname(_file);
    // 用于查询 url().
    
    var fileContent = fs.readFileSync(_file,"UTF-8");
    var matchedResult=null;
	switch(_type) {
		case "css":
    		matchedResult = fileContent.match(regs.cssRegExp);
            // console.log(matchedResult);
			break;
		case "html":
    		matchedResult = fileContent.match(regs.htmlRegExp);
            // console.log(matchedResult);
			break;
		case "js":
    		matchedResult = fileContent.match(regs.htmlRegExp);
			break;
	}
	if(!matchedResult){
		writeFile();
		return;
	}
	if (!version) {
        withoutVersion();
    } else {
        withVersion();
    }
    writeFile();
    // Definition: 指定版本号的情况.
    function withVersion () {
        console.log("You provided the version name \"" + version + "\", all pictures's querying param will be replaced.");
        // console.log("您指定了一个版本号，所有图片地址都将添加您指定版本号.")
        matchedResult.forEach(function (value, index, array) {
            var urlPath=value.replace(appConfig.picRepRxp,"");
            replaceRegexpImg(urlPath,version);
        });
    }

    // Definition: 没有版本号的情况. 遍历所有图片后生成 hash 并替换.
    function withoutVersion () {
        matchedResult.forEach(function (value, index, array) {
             // console.log(value);
            var urlPath=value.replace(appConfig.picRepRxp,"");
            // console.log(urlPath);
            if (urlPath.match(appConfig.httpRegExp)) {
                console.log(chalk.gray("http-url \" " + urlPath + "\" detected, skip adding querying param."));                         
                // console.log("检测到 http 图片 \"" + urlPath + "\", 将跳过添加版本号."); 
                return;
             }  // 如果是 http 的地址则跳过.
            var _f=urlPath.charAt(0);
            var picPath =_f=="/"?node_path.join(cwd,urlPath):node_path.join(_filePath,urlPath);
            picPath = picPath.replace(/\/.\//gi, "/");
            var picHash ="";
            var _path="";
            // 如果图片不在 dist 目录, 则尝试从 public 目录中读取.
            if (!fs.existsSync(picPath)) {
                if(publicPath && _f!="/"){
                    picPath = node_path.join(publicPath,urlPath);
                    _path=node_path.resolve(picPath);
                    picHash = createPicHash(_path);  // 获取图片的 MD5 值.
                }
            }else{
                _path=node_path.resolve(picPath);
                if(!sourceMap[_path]){//文件存在并且md5不存在sourceMap，加入当前文件到阻塞队列

                    if(blockingQueue[_path] && blockingQueue[_path]["queue"][_file] ){//_file和_path相互包含
                        picHash = createPicHash(_path);  // 获取图片的 MD5 值.
                        replaceRegexpImg(urlPath,picHash);
                        console.log(chalk.red("Warning: file "+_file + " and file "+ _path +" contain each other,it will return file "+_path+"'s md5 string immediately."));
                        return;
                    }

                    if(!blockingQueue[_file]){
                        blockingQueue[_file]={};
                        blockingQueue[_file].queue={};
                        blockingQueue[_file].option={
                            _file:_file,
                            build:build,
                            _type:_type,
                            _isRep:_isRep
                        };
                    }
                    
                    blockingQueue[_file]["queue"][_path]=true;
                    if(!option.queue[_path]){
                        option.queue[_path]={};
                    }
                    option.queue[_path][_file]=true;
                    _bool=false;

                    return false;
                }
                picHash=sourceMap[_path];
            }

            if(option.auto && !picHash){//开启找不到文件默认时间戳
               picHash= new Date().getTime();
            }
            if(picHash){
                replaceRegexpImg(urlPath,picHash);
            }
        });
    }

    function  replaceRegexpImg(urlPath,_version){
    	switch(_type) {
    		case "css":
                // console.log(urlPath + "-----" +_version);
				var replaceRegexp = new RegExp('('+urlPath + ')\\s*(["|\']?\\s*)[\\)]', "g");
				fileContent = fileContent.replace(replaceRegexp, "$1?" + _version+"$2\)");  // 使用版本号.
				// 替换所有的单引号为双引号.
				fileContent = fileContent.replace(/'/gi, "\"");
    			break;
    		case "html":
	    	var replaceRegexp = new RegExp('((^|)\\s*('+_filter+')\\s*=\\s*\\\\?["|\']?\\s*'+urlPath + ')(?![\\?|#])\\s*(\\\\?["|\'|\\s|>|/])', "g");
				fileContent = fileContent.replace(replaceRegexp, "$1?" + _version+"$4");
    			break;
    		case "js":
	    	var replaceRegexp = new RegExp('((^|)\\s*('+_filter+')\\s*=\\s*\\\\?["|\']?\\s*'+urlPath + ')(?![\\?|#])\\s*(\\\\?["|\'|\\s|>|\/>])', "g");
				fileContent = fileContent.replace(replaceRegexp, "$1?" + _version+"$4");
    			break;
    	}

    }

    // Definition: 生成图片 Hash 函数.
    function createPicHash (path) {
        if(sourceMap[path]){
            return  sourceMap[path];
        }
         // console.log(path);
        if (!fs.existsSync(path)) {
            console.log(chalk.red('File "' + path + '" not exist, no md5 will returned.'));
            // console.log('文件 "' + path + '" 不存在, 将跳过版本号添加.');        
            return new Date().getTime();
        }
        return md5(fs.readFileSync(path)).substr(0, 8);
    }
	function writeFile(){
        if(!_bool){//存在文件但是还没有生成md5的情况
            return;
        }
        sourceMap[_file]=md5(fileContent).substr(0, 8);
        // console.log(_file +"生成md5完毕....");
        var _queue=option.queue[_file]?option.queue[_file]:{};
        var _xfile,xbuild,_xtype,_xisRep;
        for(var key in _queue){
           var _q=option.blockingQueue[key]?option.blockingQueue[key].queue:null;
           if(!_q){
                continue;
           }
           delete option.blockingQueue[key].queue[_file];
           if(count(option.blockingQueue[key].queue)<1){//queue list都已经md5完毕
                _xfile=option.blockingQueue[key].option._file;
                xbuild=option.blockingQueue[key].option.build;
                _xtype=option.blockingQueue[key].option._type;
                _xisRep=option.blockingQueue[key].option._isRep;
                delete option.blockingQueue[key];
                process.nextTick(function(){
                    rev(_xfile,xbuild,_xtype,_xisRep,option);
                });
           }
        } 
        delete option.queue[_file];

        if(_isRep){
            fileContent=dirReplace.repWithData(_file, build,_type,option,fileContent);
        }
        // console.log(option.blockingQueue);
		fs.writeFile(build, fileContent,function(err){
	        if(err){
	            console.error("write file "+build+" error:"+err);
	            return;
	        }
	        console.log(chalk.green(build+" == done."));
	    });
	}
};

function getPath(path, isDir){
	path = path.replace(/\\/g, '/')
	if(isDir){
	    path += /\/$/.test(path) ? '' : '/'
	}
	return path;
}
function count(obj){
    var  count=0; 
    for(var key in obj){ 
        count++;
    }
    return count;
}

module.exports=rev;