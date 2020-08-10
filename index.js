const mkdirp = require('mkdirp')
const path = require('path')
const FS = require('fs').promises
const Translate=require('./translate')
const FOXBAT_DIRECTORY='.foxbat'

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
	}

    	async renderFile(file, ctx, opts){
        	const options = Object.assign({}, this.options,opts)
        	const paths = options.root.map(root => this.fs.resolve(root, file, options.extname));

        	for (const filepath of paths) {
			var sub_ctx=Object.assign({},ctx)
            		if (!this.fs.existsSync(filepath))
                		continue;
			const inter=interFile(filepath,sub_ctx._.LOCALE)
			if (!sub_ctx._)
				sub_ctx._={}
			sub_ctx._.FILEPATH=filepath
			console.log("CTX="+JSON.stringify(sub_ctx))
			var content
			if (isNewer(filepath,inter)){
				content = await this.preliquid.renderFile(filepath,sub_ctx,opts)
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

function interFile(file,locale){
	return [path.dirname(file),FOXBAT_DIRECTORY,locale,path.basename(file)].join('/')
}
