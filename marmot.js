const MAX_KEY_LENGTH=1024
const modelReader=require('sequelize-modelreader')
const Sequelize=modelReader(require('sequelize'))
const gettextParser= require("gettext-parser");

const defaultOptions={
	directory:__dirname, // root directory for models
	domain:"no.domain.set", // the domain name of your project
	source_locale:'en', // the locale of the input data, what language the stuff was marked up in
	locale:'en', // the default locale you want to translate to

	// you are required, using a local instance of MySQL, to create a user marmot of password marmot and full access to DB marmot,
	// OR override the below. Postgres, SQL-Lite, MariaDB should all work.
	database:'marmot',
	user:'marmot',
	password:'marmot',
	host:'localhost',
	dialect:'mysql'
}

module.exports=class Marmot{
	constructor(options) {
		this.options=Object.assign(defaultOptions,options)
		if (this.options.sequelize)
			this.sequelize=this.options.sequelize
		else
			this.defaultSequelize()
		this.sequelize_init=false
		this.DefaultNamespaceIds={}
		this.DefaultNamespaceId=undefined
		this.Namespaces={}
		this.Phrases={}
		this.Instances={}
	}

	async initialize(options){
		if (!this.sequelize_init){
			await this.sequelize.sync()
			this.sequelize_init=true
		}
		this.set_locale(options)
	}

	async set_locale(options){
		if (typeof options == 'string')
			options={locale:options}
		this.options=Object.assign(this.options,options)

		if (!this.DefaultNamespaceIds[this.options.locale]){
			const defaultNamespace= await this.registerNamespace('')
			this.DefaultNamespaceIds[this.options.locale]=defaultNamespace.id
		}

		this.DefaultNamespaceId=this.DefaultNamespaceIds[this.options.locale]
		return this.DefaultNamespaceId
	}

	defaultSequelize(){
		this.sequelize = new Sequelize(this.options.user,this.options.password,this.options.database, {
			host: this.options.host,
			dialect: this.options.dialect
		});
		return this.sequelize.loadModels(this.options.directory+'/marmot',Sequelize.DataTypes)
	}

	namespace(name){
		return this.options.domain+'/'+name 
	}

	key(phrase){
		return phrase.substring(0,MAX_KEY_LENGTH)
	}

	async registerNamespace(name){
		if (this.Namespaces[name])
			return this.Namespaces[name]

		const [Namespace]= await this.sequelize.models.Namespace.findOrCreate({
			where:{
				namespace:name,
			},
			defaults:{
				namespace:name,
				locale:this.options.source_locale,
				// public_key: some obfuscation of name
			}
		})
		return this.Namespaces[name]=Namespace
	}

	async registerPhrase(phrase,options){
		const key=this.key(phrase)
		if (this.Phrases[key])
			return this.Phrases[key]

		const [Phrase]= await this.sequelize.models.Phrase.findOrCreate({
			where:{
				key:key,
				locale:this.options.source_locale
			},
			defaults:{
				key:key,
				phrase:phrase,
				locale:this.options.source_locale,
				origin:this.options.domain,
				rank:options.rank,
				control:options.control,
				PhraseId:options.PhraseId
			},
		})
		return this.Phrases[key]=Phrase
	}
	async registerInstance(PhraseId,NamespaceId){
		this.Instances[PhraseId]= this.Instances[PhraseId] || {}
		if (this.Instances[PhraseId][NamespaceId])
			return this.Instances[PhraseId][NamespaceId]

		const [Instance]= await this.sequelize.models.Instance.findOrCreate({
			where:{
				NamespaceId:NamespaceId,
				PhraseId:PhraseId,
			},
			defaults:{
				NamespaceId:NamespaceId,
				PhraseId:PhraseId,
			}
		})
		return this.Instances[PhraseId][NamespaceId]=Instance
	}

	async getTranslations(PhraseId,NamespaceId){
		var translations = await this.sequelize.models.Translation.findAll({
			where:{
				PhraseId:PhraseId,
				locale:this.options.locale
			}
		})
		translations= this.orderTranslations(translations,NamespaceId)
		return translations
	}

	orderTranslations(translations,NamespaceId){
		if (!translations || !translations.length)
			return undefined

		translations.forEach((t)=>{
			if (t.NamespaceId===NamespaceId)
				t.order=2
			if (t.NamespaceId===this.DefaultNamespaceId)
				t.order=1
			if (!t.order)
				t.order=0
			t.translation=""+t.translation
		})
		function order(A,B){
			return A.order-B.order
		}

		translations= translations.sort(order)
		return translations
	}

	async establish(phrase_phrase,options){
		if (options.filepath)
			options.context=subPath(options.filepath,this.options.directory)

		const name = options.context ? this.namespace(options.context) : ''
		const namespace=await this.registerNamespace(name)
		options.source_locale=namespace.locale
		const phrase=await this.registerPhrase(phrase_phrase,options)
		await this.registerInstance(phrase.id,namespace.id)
		return [phrase.id,namespace.id]
	}
	
	async Get(phrase,options){
		const [PhraseId,NamespaceId]= await this.establish(phrase,options)
		const translations=await this.getTranslations(PhraseId,NamespaceId)
		if (!translations || !translations.length){
			return { 
				PhraseId:PhraseId,
				NamespaceId,NamespaceId,
				translation:phrase
			}
		}
		return translations[0]
	}

	async putTranslation(PhraseId,NamespaceId,translation,options){
		const [DefaultTranslation,default_created]= await this.sequelize.models.Translation.findOrCreate({
			where:{
				NamespaceId:this.DefaultNamespaceId,
				PhraseId:PhraseId,
				locale:this.options.locale
			},
			defaults:{
				NamespaceId:this.DefaultNamespaceId,
				PhraseId:PhraseId,
				locale:this.options.locale,
				translation:translation,
			}
		})

		if (DefaultTranslation.translation == translation)
			return DefaultTranslation

		const [Translation,created]= await this.sequelize.models.Translation.findOrCreate({
			where:{
				NamespaceId:NamespaceId,
				PhraseId:PhraseId,
				locale:this.options.locale
			},
			defaults:{
				NamespaceId:NamespaceId,
				PhraseId:PhraseId,
				locale:this.options.locale,
				translation:translation,
			}
		})

		if (Translation.translation != translation){
			console.error("WARNING, subsequent translation discared using Put() interface. Use direct table access to manipulate or update")
		}

		return Translation
	}

	async Put(phrase,translation,options){
		if (options == undefined)
			options={}
		if (typeof options == 'string')
			options={context:options}

		const [PhraseId,NamespaceId]= await this.establish(phrase,options)
		const Translation=await this.putTranslation(PhraseId,NamespaceId,translation,options)
		return Translation 
	}

	async Dump(){
		const gt=await this.getGetText()
		return gettextParser.po.compile(gt)
	}

	async getGetText(){
		var phrases = await this.sequelize.models.Phrase.findAll({
			where:{
				PhraseId:null
			},
			include:[{
				model:this.sequelize.models.Translation,
				where:{
					locale:this.options.locale
				},
				include:this.sequelize.models.Namespace,
			},{
				model:this.sequelize.models.Phrase,
				as:'PluralPhrase',
				include:{
					model:this.sequelize.models.Translation,
					where:{
						locale:this.options.locale
					},
					include:this.sequelize.models.Namespace
				}
			}],
		})
		return toGettext(phrases)
	}

	async Load(content){
		var gt=gettextParser.po.parse(content)
		gt=processHeader(gt)
		await this.putGetText(gt)
		return
	}

	async putGetText(gt){
		await Object.keys(gt.translations).forEach(async (name)=>{
			await Object.keys(gt.translations[name]).forEach(async (key)=>{
				var translation=gt.translations[name][key]
				if (translation.msgstr.length == 1){
					await this.Put(translation.msgid,translation.msgstr[0],{rank:'none',context:translation.msgctxt})
					return
				}
				if (translation.msgstr.length == 2){
					await this.Put(translation.msgid,translation.msgstr[0],{rank:'singular',context:translation.msgctxt})
					await this.Put(translation.msgid,translation.msgstr[1],{rank:'plural',context:translation.msgctxt})
					return
				}
				// TODO: assert we only have 3
				await this.Put(translation.msgid,translation.msgstr[0],{rank:'empty',context:translation.msgctxt})
				await this.Put(translation.msgid,translation.msgstr[1],{rank:'singular',context:translation.msgctxt})
				await this.Put(translation.msgid,translation.msgstr[2],{rank:'plural',context:translation.msgctxt})
			})
		})
		return
	}
}

function processHeader(gt){
	if (gt.translations[""] && gt.translations[""][""]){
		delete gt.translations[""][""]
	}
	return gt
}


function toGettext(phrases){
	var translations={}
	phrases.forEach((phrase)=>{
		phrase.Translations.forEach((translation)=>{
			name=translation.Namespace.namespace
			if (!translations[name])
				translations[name]={}
			translations[name][phrase.key]=poform(phrase,translation)
		})
	})

	return {translations:translations}
}

function poform(phrase,translation){
	var output={comments:{}}

	if (phrase.control)
		translation.comments.control=phrase.control

	output.msgid=phrase.key
	output.msgctxt=translation.Namespace.namespace


	if (!phrase.PluralPhrases){
		output.msgstr=[translation.translation]
	} else {
		order={
			'empty':0,
			'singular':1,
			'plural':2,
		}
		var group=[
			[phrase.rank,translation.translation]
		]

		var first=phrase.PluralPhrases[0]
		group.push(
			[first.rank,first.Translations[0].translation]
		)

		var second=phrase.PluralPhrases[1]
		if (second)
			group.push(
				[second.rank,first.Translations[0].translation]
			)

		output.msgstr=group.sort((A,B)=>{
			return order[A[0]] - order[B[0]]
		})
		.map((g)=>{
			return g[1]
		})
	}
	console.log("POFORM="+JSON.stringify(output))
	return output
}


function subPath(path,root){
	if (path.substr(0,root.length) != root)
		return path
	return path.substr(root.length)
}
