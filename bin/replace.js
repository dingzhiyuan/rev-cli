const fs = require("fs");
const node_path = require("path");
const chalk = require('chalk');
function Replace() {
	return new Replace.prototype.init();
}
Replace.prototype.init=function(){
	return this;
}

Replace.prototype.rep = function(path, build,_type,option) {
	var base=option.cwd,_replacements=option._replacements,_filter=option.filter;
	var _rules=this.assembly(base,path,_replacements),_me=this;
	console.log(_rules);
	fs.readFile(path,function(err, data){
		if(err){
			console.error("read file "+path+" error:"+err);
			return;
		}
		data = data.toString();
		data = _me.r(_rules,data,_type,_filter);
		fs.writeFile(build, data,function(err){
			if(err){
				console.error("write file "+build+" error:"+err);
				return;
			}
	        console.log(chalk.green(build+"  == done."));
	    });
	});
};

Replace.prototype.repWithData=function(path, build,_type,option,file) {
	var base=option.cwd,_replacements=option._replacements;
	var _rules=this.assembly(base,path,_replacements);
	return this.r(_rules,file,_type,option.filter);
}
Replace.prototype.assembly=function(base,path,_replacements){
	var _obj={};
	for(var item in _replacements){
	    var xpath=node_path.join(base,item);
	    var re=node_path.relative(node_path.dirname(path),xpath);
	    if(!re){
	    	_obj["empty"]=_replacements[item];
	    }else{
	    	_obj[getPath(re,/\./.test(re)?0:1)]=_replacements[item];
	    }
	    
	}
	return extend(true,_obj,_replacements);
}
Replace.prototype.r=function(_rules,data,_type,_filter){
	for (var dir in _rules) {
		var tmp=dir.replace(/(\/|\.|\?|\$|\||\*|\+|\^|\\|\-)/gi, "\\$1");
		
		switch(_type) {
			case "css":
				var replaceRegexp = new RegExp('((^|)\\s*url\\s*\\(\\s*["|\']?\\s*)'+ (dir!='empty'?tmp+'(':'([^\\/\\.\\s[https|http|ftp|rtsp|mms]') + '[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@=\\?!]*\\s*["|\']?\\s*[\\)])', "g");
				data=data.replace(replaceRegexp, "$1" + _rules[dir]+"$3");
				console.log(data.match(replaceRegexp));
				console.log(dir);
				break;
			case "html":
				var replaceRegexp = new RegExp('((^|)\\s*('+_filter.join("|")+')\\s*=\\s*\\\\?["|\']?\\s*)'+ (dir!='empty'?tmp+'(':'([^\\/\\.\\s[https|http|ftp|rtsp|mms]"\'') + '[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@=\\?!]*\\s*\\\\?["|\'|\\s|>|\\/>])', "g");		
				data=data.replace(replaceRegexp, "$1" + _rules[dir] +"$4");
				break;
			case "js":
				var replaceRegexp = new RegExp('((^|)\\s*('+_filter.join("|")+')\\s*=\\s*\\\\?["|\']?\\s*)'+ (dir!='empty'?tmp+'(':'([^\\/\\.\\s[https|http|ftp|rtsp|mms]"\'') + '[0-9a-zA-Z+\\-*%/\\\\<>.,;:_&^%$#@=\\?!]*\\s*\\\\?["|\'|\\s|>|\\/>])', "g");
				
				data=data.replace(replaceRegexp, "$1" + _rules[dir] +"$4");

				break;
		}
	}
	return data;
}
Replace.prototype.init.prototype=Replace.prototype;
module.exports = Replace;

function getPath(path, isDir){
	path = path.replace(/\\/g, '/')
	if(isDir){
	    path += /\/$/.test(path) ? '' : '/'
	}
	return path;
}
function extend(deep, target, options) { 
      for (name in options) { 
         copy = options[name]; 
          if (deep && copy instanceof Array) { 
              target[name] = extend(deep, [], copy); 
         } else if (deep && copy instanceof Object) { 
              target[name] = extend(deep, {}, copy); 
          } else { 
            target[name] = options[name]; 
        } 
   } 
   return target; 
} 