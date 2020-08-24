const Marmot=require('./marmot')
const translateTagParse=require('./translateTagParse')

module.exports=function(Liquid){
	if (!Liquid)
		Liquid=require('liquidjs').Liquid

	return class Translate extends Liquid {
		constructor(options){
			super(options)
			this.registerTag('translate',translate)
			this.registerTag('transform',transform)
			this.marmot=new Marmot(options)
		}
	}
}

const transform={
	parse: function (token,context) {
		var results=translateTagParse(token.args,context)
		this.phrases=results[0]
		this.control=results[1]
		this.execution_phase=results[2]
	},
	render: async function (context, emitter) {
		var rank=determine_rank(context,this.control)
		translation = this.phrases[rank]
		const output = await this.liquid.parseAndRender(translation, context.environments)
		return emitter.write(output)
	}
}

const translate={
	parse: function (token,context) {
		var results=translateTagParse(token.args,context)
		this.phrases=results[0]
		this.control=results[1]
		this.execution_phase=results[2]
	},
	render: async function (context, emitter) {
		var translations={}
		var nrank
		var job=Promise.resolve()
		var me=this
		var PhraseId
		Object.keys(this.phrases).forEach((rank)=>{
			job=job.then(()=>{
				return me.liquid.marmot.Get(this.phrases[rank],{
					filepath:context.environments._.FILEPATH,
					rank:rank,
					control:me.control
				}) 
				.then((r)=>{
					translations[rank] = r
					nrank=rank
				})
			})
		})
		await job

		this.PhraseId=translations[nrank].PhraseId
		this.NamespaceId=translations[nrank].NamespaceId

		var emit_divs=isHtml(context) && !context.environments._.NO_DEBUG
		if (emit_divs)
			emitter.write("<div class=i18n id="+this.PhraseId+" ns="+this.NamespaceId+">")

		switch(this.execution_phase){
			case undefined:
			case 'none':
			case 'once':
				var rank=determine_rank(context,this.control_variable)
				var translation=translations[nrank].translation
//				const output = await this.liquid.evalValue(translation, context)
//		console.log("OUTPUT="+output)
//				emitter.write(output)
				emitter.write(translation)
				break
			case 'every':
			case 'client':
				emitter.write(transformCode(translations,this.control,this.execution_phase))
				break
		}

		if (emit_divs)
			emitter.write("</div>")
	}
}

function isHtml(context){
	return context.environments._.IS_HTML ||  context.environments._.FILEPATH.match(/html$/)
}

function transformCode(translations,control,execution_phase){
	var args=Object.keys(translations).map(function (rank){
		return rank+'="'+translations[rank].translation+'"'
	})

	args.push('control='+control)
	args=args.join(', ')
	// are we going {? for server time, or traditional {{ client side
	exec_phase_open_char= execution_phase == 'every' ? '@' : '%' 
	exec_phase_close_char= execution_phase == 'every' ? '@' : '%'

	const output= '{'+exec_phase_open_char+'transform '+args+' '+exec_phase_close_char+'}'
	console.log("OUTPUT="+output)
	return output
}



function determine_rank(context,control){
	// TODO, use liquid's internal resolution code
	switch (context.environments[control]){
		case undefined:
		case 0:
			return 'empty'
		case -1:
		case 1:
			return 'singular'
		default:
			return 'plural'
	}
}
