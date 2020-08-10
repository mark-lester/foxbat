const Marmot=require('./marmot')

module.exports=function(Liquid){
	if (!Liquid)
		Liquid=require('liquidjs').Liquid

	return class Translate extends Liquid {
		constructor(options){
			super(options)
			this.registerTag('translate',translate)
			this.marmot=new Marmot(options)
		}
	}
}

const translate={
	parse: function (token) {
	// todo to accept singuar:"single", plural:"plural"
		this.phrase = token.args;
	},
	render: async function (context, emitter) {
		const phrase = await this.liquid.evalValue(this.phrase, context)
		console.log("IN TRANSLATIONS"+JSON.stringify(context))
		var translation = await this.liquid.marmot.Get(phrase,{
			context:context.environments.FILEPATH
		})
		if (translation == undefined)
			translation=phrase
		emitter.write(translation)
	}
}
