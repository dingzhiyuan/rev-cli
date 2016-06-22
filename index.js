const fs = require("fs");
const node_path = require("path");
const ver = require("./bin/index");
const md5 = require('md5');
const chalk = require('chalk');
const dirReplace = require('./bin/replace')();
module.exports = function (options) {
	var defaults={
		base:'',
	    dist:"rev_build",
	    public:"",
	    version:null,
	    propWhiteList:[],
	    excludes:[],
	    repExcludes:[],
	    replacements:{

	    }
	},_o={},build_path,_paths={css:[],js:[],html:[]}; 
	_o=options?extend(true,defaults,options):defaults;
	_o.sourceMap={};
	_o.filter=["src","href"];
	if(_o.propWhiteList.length>0){
		_o.propWhiteList.forEach(function(val,index){
			if(getItem(_o.filter,val)>-1){
				return;
			}
			if(/[^0-9a-zA-Z0\-]+/.test(val)){
				return;
			}
			_o.filter.push(val.replace(/(\/|\.|\?|\$|\||\*|\+|\^|\\|\-)/gi, "\\$1"));
		});
	}
	var cwd=_o.cwd=_o.base?node_path.join(process.cwd(),_o.base):process.cwd();
	if(!_o.dist){
		_o.dist="rev_build"
	}
	// replacements 绝对路径转换
	_o._replacements={};
	for (var _dir in _o.replacements) {
		// var _dirPath=node_path.relative(cwd,_dir);
		// console.log("_dirPath "+_dir.replace(/^\//,""));
		var _prefix="/";
		var _suffix=/\./.test(_dir)?0:1;
		_o._replacements[_prefix+getPath(_dir.replace(/^\//,""),_suffix)]=getPath(_o.replacements[_dir],_suffix);

	}
	_o.excludes=isArray(_o.excludes)?_o.excludes:_transform(_o.excludes);
	// 转化exclude数组成绝对路径
	if(_o.excludes.length>0){
		_o.excludes.forEach(function(e,i){
			var xpath=node_path.join(cwd,e);
			_o.excludes[i]=getPath(xpath,/\.(css|js|html)/.test(xpath)?0:1);
		});
	}
	_o.repExcludes=isArray(_o.repExcludes)?_o.repExcludes:_transform(_o.repExcludes);
	// 转化exclude数组成绝对路径
	if(_o.repExcludes.length>0){
		_o.repExcludes.forEach(function(e,i){
			var xpath=node_path.join(cwd,e);
			_o.repExcludes[i]=getPath(xpath,/\.(css|js|html)/.test(xpath)?0:1);
		});
	}
	_o.public=_o.public?node_path.join(cwd,_o.public):"";
	// 存储地址
	build_path=_o.build_path=node_path.join(cwd,_o.dist);

	var isrep=getPropertyCount(_o._replacements)>0?true:false;//是否需要替换
	fs.exists(build_path,function(exists){
		if(exists){
			deleteFolderRecursive(build_path,function(){
				fs.mkdir(build_path, function (err) {
					if(err){
						throw err;
					}
					console.log(build_path+" dir created.");
					readFile(cwd,build_path,true,isrep)	
				});
			});
			return;
		}
		fs.mkdir(build_path, function (err) {
			if(err){
				throw err;
			}
			console.log(build_path+" dir created.");
			readFile(cwd,build_path,true,isrep)
			
		});
	});
	function readFile(_cwd,_build,_isRev,_isRep){
		var _files=fs.readdirSync(_cwd);
	        _files.forEach(function (e, i) {
	            var path=node_path.join(_cwd,e);
	            var build=node_path.join(_build,e);

	            //存在排除数组中 直接返回
	            var stat=fs.statSync(path);
	            if(stat.isDirectory() && build_path==path){//如果是发布地址直接跳过
	            	console.log(chalk.gray(path+" passed."));
	            	return;
	            }

                if(stat.isDirectory()){
                	var _isRevv=getItem(_o.excludes,getPath(path,1))>-1?false:true;
	            	var _isRepv=getItem(_o.repExcludes,getPath(path,1))>-1?false:true;
					fs.mkdir(build, function (err) {
						if(err){
							throw err;
						}
					});
                   readFile(path,build,_isRevv,_isRepv);
                }else{
                	_isRev=!_isRev?_isRev:(getItem(_o.excludes,getPath(path,0))>-1?false:true);
	           		_isRep=!_isRep?_isRep:(getItem(_o.repExcludes,getPath(path,0))>-1?false:true);
	           		
                    if(node_path.extname(path)==".css"){
                       _o.sourceMap[path]=createPicHash(path);
                       _paths.css.push(path);
                       if(_isRev){
	                       	process.nextTick(function(){
	                       		ver(path,build,"css",_isRep,_o);
	                       });
	                    }else{
	                    	if(_isRep){
		                    	process.nextTick(function(){
		                    		dirReplace.rep(path, build,"css",_o);
		                    	});
		                    }
	                    }
                       
                    }else if(node_path.extname(path)==".js"){
                    	_o.sourceMap[path]=createPicHash(path);
                       _paths.js.push(path);
                       if(_isRev){
	                       	process.nextTick(function(){
	                       		ver(path,build,"js",_isRep,_o);
	                       });
	                    }else{
	                    	if(_isRep){
		                    	process.nextTick(function(){
		                    		dirReplace.rep(path, build,"js",_o);
		                    	});
		                    }
	                    }
                    }
                    else if(node_path.extname(path)==".html"){
                       _paths.html.push(path);
                       if(_isRev){
	                       	process.nextTick(function(){
	                       		ver(path,build,"html",_isRep,_o);
	                       });
	                    }else{
	                    	if(_isRep){
		                    	process.nextTick(function(){
		                    		dirReplace.rep(path, build,"html",_o);
		                    	});
		                    }
	                    }
                      
                    }
                    else if(node_path.extname(path).toLowerCase().match("(jpg|gif|bmp|png|webp|svg|eot|woff|ttf)")){
                    	// console.log(path);
                    	// console.log("image....");
                    	_o.sourceMap[path]=createPicHash(path);
                    	copyFile(path,build);
                    }else{
						
                    	copyFile(path,build);
                    }
                    
                }
	            
	        });
	}
};

function copyFile(_src,_dst){
	fs.readFile(_src,function(err, data){
		if(err){
			console.error("read file "+_src+" error:"+err);
			return;
		}
		fs.writeFile(_dst, data,function(err){
			if(err){
				console.error("write file "+_dst+" error:"+err);
				return;
			}
	        console.log(chalk.green(_dst+"  == done."));
	    });
	});
}
function deleteFolderRecursive(dir,callback){
	var exec = require('child_process').exec,child;
	if(process.platform=="win32"){
		child = exec('rd/s/q '+dir,function(err,out) { 
		  console.log(out);
		  if(err){
		  	console.log(err);
		  	return;
		  }
		  callback();
		});
	}else{
		child = exec('rm -rf '+dir,function(err,out) { 
		  console.log(out);
		  if(err){
		  	console.log(err);
		  	return;
		  }
		  callback();
		});
	}
	
}
function isArray(obj){
    return Object.prototype.toString.call(obj) === '[object Array]';  
}
function _transform(obj){
    var arr = [];
    for(var item in obj){
        arr.push(obj[item]);
    }
    return arr;
}

function getItem(_arr,e){
  for(var i=0,j; j=_arr[i]; i++){
    if(j==e){
    	return i;
    }
  }
  return -1;
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
function getPath(path, isDir){
	path = path.replace(/\\/g, '/')
	if(isDir){
	    path += /\/$/.test(path) ? '' : '/'
	}
	return path;
}

function createPicHash (path) {
    if (!fs.existsSync(path)) {
        console.log(': File "' + path + '" not exist, no md5 will returned.');
        // console.log('文件 "' + path + '" 不存在, 将跳过版本号添加.');        
        return "";
    }
    return md5(fs.readFileSync(path)).substr(0, 6);
}

function getPropertyCount(o){
   var n, count = 0;
   for(n in o){
      if(o.hasOwnProperty(n)){
         count++;
      }
   }
   return count;
}
