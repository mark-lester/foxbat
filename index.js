const mkdirp = require('mkdirp')
const path = require('path')
const FS = require('fs').promises
const Translate=require('./translate')
const FOXBAT_DIRECTORY='.foxbat'
const assert=require('assert')

const defaultLocale='en'
const defaultContext={'$':{}}
module.exports=function(Liquid){

if (!Liquid)
	Liquid=Translate(require('liquidjs').Liquid)

return class Foxbat extends Liquid {
	constructor(options){
		options=options||{}
		super(Object.assign(options,{
			tagDelimiterLeft:options.everyTagDelimiterLeft || '{@',
			tagDelimiterRight:options.everyTagDelimiterRight ||  '@}',
			outputDelimiterLeft:options.everyOutputDelimiterLeft ||  '{$',
			outputDelimiterRight:options.everyOutputDelimiterRight ||  '$}',
		}))

		this.preliquid=new Liquid(Object.assign(options,{
			tagDelimiterLeft:options.onceTagDelimiterLeft || '{!',
			tagDelimiterRight:options.onceTagDelimiterRight ||  '!}',
			outputDelimiterLeft:options.onceOutputDelimiterLeft ||  '{?',
			outputDelimiterRight:options.onceOutputDelimiterRight ||  '?}',
		}))

		// TODO untangle this. We need to be able to chain instantiation. 
		// Make a liquid, then make another with child (liquid) and inherity the marmot
		// you (generally) only ever want to translate something into one language shirley,
		// so we only need one instance of marmot which we can inherit
		if (this.marmot)
			this.preliquid.marmot=this.marmot
	}

    	async renderFile(file, ctx, opts){
		if (opts && opts['$'])
			assert(typeof opts['$'] == 'object')

        	const options = Object.assign(this.options,opts)
        	const paths = options.root.map(root => this.fs.resolve(root, file, options.extname));
		const locale=this.marmot.get_locale()

        	for (const filepath of paths) {
			var sub_ctx=Object.assign(defaultContext,ctx)
            		if (!this.fs.existsSync(filepath))
                		continue;
			const inter=interFile(filepath,locale)
			const directory=interDir(filepath,locale)
			sub_ctx['$'].FILEPATH=filepath
			var content
			if (isNewer(filepath,inter)){
				content = await this.preliquid.renderFile(filepath,sub_ctx,opts)
				await FS.mkdir(directory,{recursive:true})
				await FS.writeFile(inter,content)
			}
			else {
				content = await FS.readFile(inter)
			}
			const tmpl= this.parse(content)
			return this.render(tmpl,sub_ctx,opts)
		}
	} 
}

}// end export


function isNewer(source,target){
	var sstat
	return FS.stat(source)
	.then((s)=>{
		sstat=s
		return FS.stat(target)
	})
	.then((f)=>{
		fstat=f
		if (!fstat || !fstat.mtime)
			return true
		return sstat.mtime > fstat.mtime
	})
	.catch((err)=>{
		return true
	})
}

function interFile(file,locale){
	return [interDir(file,locale),path.basename(file)].join('/')
}
function interDir(file,locale){
	return [path.dirname(file),FOXBAT_DIRECTORY,locale].join('/')
}
