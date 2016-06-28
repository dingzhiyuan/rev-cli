# Rev CLI

A command line Rev


## Install

`npm install --g rev-cli`

## Usage

Rev CLI takes 1 arguments:

|Argument|Alias|Default|Description|
|---|---|---|---|
|`--version`|`-v`|`n/a`|the version eg:20160620|

## Example
cd you website folder

`rev -v 20160620`

the arg is not a must.


## Without arguments

cd you website folder

`rev`

it will use default options.and  it will use file's md5 string as version string; 

##Other way

`

var rev=require("rev-cli");

rev({

    base:'',//this base path relative to cwd, if it empty ,it will use the cwd as the root of the website

    dist:"rev_build",//the folder to write the rev files,beifore execute "rev" ,this folder will be clean

    public:"",//public resource folder

    version:null,

    excludes:[]//folder or files do not execute "rev" 

    propWhiteList:[],more attr to match in html and js files,defauts "src" and "href",if you want more add it

    repExcludes:[],//folder or files do not execute "replace url" 

    replacements:{
    }//file path or folder path to replace eg  "style":"http://www.xxx.com/style"
    
})

`

## Default options



`{
	
	base:'',//this base path relative to cwd, if it is empty ,it will use the cwd as the root of the website

    dist:"rev_build",//the folder to write the rev files,beifore execute "rev" ,this folder will be clean

    public:"",//public resource folder

    version:null,

    imgExts:[],

    exts:[],

    revExts:[],

    auto:false,

    excludes:[]//folder or files do not execute "rev" 

    propWhiteList:[],more attr to match in html and js files,defauts "src" and "href",if you want more ,add it

    repExcludes:[],//folder or files do not execute "replace url" 

    replacements:{
    }//file path or folder path to replace eg  "style":"http://www.xxx.com/style"
}`


but you can create a "rev.json" file in the cwd folder to rewrite the options

## About replacements
warning: it will replace the path in accordance with the order.

if we have a config like :

`replacements:{
	
	"style":"http://www.xxx.com/style",

	"js":"http://www.xxx.com/js"

}`

and we have a "index.html" and "xxx/index.html" in the root folder,also style folder in the root folder too.

it will replace all "style/" and "/style/" as "http://www.xxx.com/style/" in "index.html"

it will replace all "../style/" and "/style/" as "http://www.xxx.com/style/" in "xxx/index.html"


##V1.0.9 bugFix

A contain B , and B contain C; if C change, B will change,but A dose not change, we fix it.

