const fs = require("fs");
const node_path = require("path");
const md5 = require('md5');
const chalk = require('chalk');
const dirReplace = new require('./replace')();


module.exports = function (_file,build,_type,_isRep,option) {
	"use strict";
    var version=option.version,publicPath=option.public,sourceMap=option.sourceMap,cwd=option.cwd,_filter=option.filter.join("|");
    var regs={
        cssRegExp:/(^|)\s*url\s*\(\s*["|']?\s*[0-9a-zA-Z+\-*%/\\<>.,;:_&^%$#@!]*\.(jpg|gif|bmp|png|webp|svg|eot|woff|ttf|css)(?![\\?|#])\s*["|']?\s*[\)]/gi,
        htmlRegExp:new RegExp('(^|)\\s*('+_filter+')\\s*=\\s*\\\\?["|\']?\\s*[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@!]*\\.(css|js|jpg|gif|bmp|png|webp|svg|eot|woff|ttf)(?![\\?|#])\\s*\\\\?["|\'|\\/>|>|\\s]','gi'),
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
    if(_isRep){
        fileContent=dirReplace.repWithData(_file, build,_type,option,fileContent);
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
            // 如果图片不在 dist 目录, 则尝试从 public 目录中读取.
            if (!fs.existsSync(picPath) && publicPath && _f!="/") {
                picPath = node_path.join(publicPath,urlPath);
            }
            var _path=node_path.resolve(picPath);
            var picHash = createPicHash(_path);  // 获取图片的 MD5 值.
           replaceRegexpImg(urlPath,picHash);
        });
    }

    function  replaceRegexpImg(urlPath,_version){
    	switch(_type) {
    		case "css":
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
        if (!fs.existsSync(path)) {
            console.log(chalk.red('File "' + path + '" not exist, no md5 will returned.'));
            // console.log('文件 "' + path + '" 不存在, 将跳过版本号添加.');        
            return new Date().getTime();
        }
        return md5(fs.readFileSync(path)).substr(0, 6);
    }
	function writeFile(){
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