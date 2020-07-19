const fs=require('fs').promises
const LRU=require('lru-cache')
const mkdirp = require('mkdirp')
const path = require('path')

const FOXBAT_DIRECTORY='.foxbat'
const ONCE_EXTENSION='.%'
const EVERY_EXTENSION='.@'
const DEFAULT_LOCALE='DEFAULT'
const ONCE_FILE_LIMIT=200
const EVERY_FILE_LIMIT=500

module.exports= class Foxbat {
	constructor(options){
		options=options||{}
		this.hbs=options.hbs || require('handlebars')
		this.once_files=new LRU(options.once_limit || ONCE_FILE_LIMIT)
		this.every_files=new LRU(options.every_limit || EVERY_FILE_LIMIT)
		return this
	}

	execute(full,locale,context){
		locale=locale || DEFAULT_LOCALE
		var dir=path.dirname(full)
		return mkdirp([dir,FOXBAT_DIRECTORY,locale].join('/'))
		.then(function(){
			return this.once(full,locale,context)
		}.bind(this)).then(function (){
			return this.every(full,locale,context)
		}.bind(this))
	}

	once_compiled_file(full){
		var dir=path.dirname(full)
		var name=path.basename(full)
		return dir+'/.'+name+ONCE_EXTENSION
	}

	once_exec_file(full,locale){
		var dir=path.dirname(full)
		var name=path.basename(full)
		return [dir,FOXBAT_DIRECTORY,locale,name].join('/')
	}

	every_compiled_file(full,locale){
		var dir=path.dirname(full)
		var name=path.basename(full)
		return [dir,FOXBAT_DIRECTORY,locale,'.'+name+EVERY_EXTENSION].join('/')
	}

	once(full,locale,context){
		return this.once_compile(full)
		.then(function (){
			return this.once_load(full)
		}.bind(this)).then(function(){
			return this.once_exec(full,locale,context)
		}.bind(this))
	}

	once_compile(full){
		var compiled=this.once_compiled_file(full)
		if (isNewer(full,compiled))
			return this.once_compile_inner(full)
	}

	once_compile_inner(full){
		var output
		this.once_files.del(full)
		return fs.readFile(full)
		.then(function(source){
			source=transform(source,['{','}'],['_','_'])
			source=transform(source,['%','%'],['{','}'])
			output=this.hbs.precompile(source,{commonjs:true})
			return fs.writeFile(this.once_compiled_file(full), output)
		}.bind(this))
		.then(function (){
			return this.once_store(full,output)
		}.bind(this))
	}

	once_load(full){
		if (this.once_files.get(full))
			return
		return fs.readFile(this.once_compiled_file())
		.then(function(output){
			return this.once_store(full,output)
		}.bind(this))
	}

	once_store(full,output){
		return this.once_files.set(full,this.hbs.template(new Function('return ' + output)()))
	}

	once_exec(full,locale,context){
		var execed=this.once_exec_file(full,locale)
		var compiled=this.once_compiled_file(full,locale)
		return isNewer(compiled,execed)
		.then(function (make){
			if (make)
				return fs.writeFile(execed,this.once_files.get(full)(context))
		}.bind(this))
	}

	every(full,locale,context){
		return this.every_compile(full,locale)
		.then(function (){
			return this.every_load(full,locale)
		}.bind(this)).then(function (){
			return this.every_exec(full,locale,context)
		}.bind(this))
	}

	every_compile(full,locale){
		var compiled=this.every_compiled_file(full,locale)
		var pre_exec=this.once_exec_file(full,locale)
		return isNewer(pre_exec,compiled)
		.then(function (make){
			if (make)
				return this.every_compile_inner(full,locale)
			return
		}.bind(this))
	}

	every_compile_inner(full,locale){
		var output
		this.every_files.del(every_key(full,locale))
		return fs.readFile(this.once_exec_file(full,locale))
		.then(function (source){
			source=transform(source,['@','@'],['{','}'])
			output=this.hbs.precompile(source,{commonjs:true})
			return fs.writeFile(this.every_compiled_file(full,locale),output)
		}.bind(this))
		.then(function(){
			return this.every_store(full,locale,output)
		}.bind(this))
	}

	every_store(full,locale,output){
		return this.every_files.set(every_key(full,locale),this.hbs.template(new Function('return ' + output)()))
	}

	every_load(full,locale){
		if (this.every_files.get(every_key(full,locale)))
			return
		return fs.readFile(this.every_complied_file(full,locale))
		.then(function(output){
			return this.every_store(full,locale,output)
		}.bind(this))
	}

	every_exec(full,locale,context){
		return transform(
			this.every_files.get(every_key(full,locale))(context),
			['_','_'],['{','}']
		)
	}
}

function isNewer(source,target){
	var sstat
	return fs.stat(source)
	.then((s)=>{
		sstat=s
		return fs.stat(target)
	}).then((f)=>{
		fstat=f
		if (!fstat || !fstat.mtime)
			return true
		return sstat.mtime > fstat.mtime
	})
	.catch((err)=>{
		return true
	})
}

function transform(s,from,to){
	var [from_start,from_end]=from
	var [to_start,to_end]=to
	s=""+s
	return s.replace(new RegExp('{'+from_start,"g"),'{'+to_start)
		.replace(new RegExp(from_end+'}',"g"),to_end+'}')
}

function every_key(full,locale){ return full+'$'+locale }
