const MAX_KEY_LENGTH=1024
const modelReader=require('sequelize-modelreader')
const Sequelize=modelReader(require('sequelize'))

const defaultOptions={
	directory:process.cwd(), // root directory for templates
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
		if (typeof options == 'string')
			options={locale:options}

		this.options=Object.assign(defaultOptions,options)
		if (this.options.sequelize)
			this.sequelize=this.options.sequelize
		else
			this.defaultSequelize()
	}

	async initialize(){
		await this.sequelize.sync()
		const defaultNamespace= await this.registerNamespace('default')
		return this.DefaultNamespaceId=defaultNamespace.id
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
		return Namespace
	}

	async registerPhrase(phrase,options){
		const key=this.key(phrase)
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
				on:options.on,
				PhraseId:options.PhraseId
			},
		})
		return Phrase
	}
	async registerInstance(NamespaceId,PhraseId){
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
		return Instance
	}

	async getTranslations(PhraseId,NamespaceId){
		const translations = await this.sequelize.models.Translation.findAll({
			where:{
				PhraseId:PhraseId,
				locale:this.options.locale
			}
		})
		return this.orderTranslations(translations,NamespaceId)
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
		})
		function order(A,B){
			return A.order-B.order
		}

		return translations.sort(order)
	}

	async getAll(phrase_phrase,options){
		const name = options.context ? this.namespace(options.context) : 'default'
		const namespace=await this.registerNamespace(name)
		const phrase=await this.registerPhrase(phrase_phrase,namespace.locale,options)
		await this.registerInstance(namespace.id,phrase.id)
		return  await this.getTranslations(phrase.id,namespace.id)
	}

	async Get(phrase,options){
		const translations= await this.getAll(phrase,options)
		if (!translations || !translations.length)
			return undefined
		return translations[0].translation
	}

	async putTranslation(NamespaceId,PhraseId,translation){
		const [Translation]= await this.sequelize.models.Translation.findOrCreate({
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
		return Translation
	}

	async Put(phrase_phrase,translation,options){
		var NamespaceId,PhraseId

		const phrase= await this.registerPhrase(phrase_phrase,options)
		const translations=await this.getAll(phrase_phrase,options)

		if (!translations || !translations.length){
			NamespaceId = this.DefaultNamespaceId
		} else {
			const namespace= await this.registerNamespace(this.namespace(context))
			if (translations.length == 1 || translations[1].NamespaceId != namespace.id)
				NamespaceId=namespace.id
		}
		return NamespaceId ? this.putTranslation(NamespaceId,phrase.id,translation) :undefined
	}
}
