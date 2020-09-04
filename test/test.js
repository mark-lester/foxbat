const Foxbat=require('../index')
const fs=require('fs').promises;
const assert = require('assert')
const SAMPLE_FILE="gettext_po_sample_file.po"
const SAMPLE_FILE_OUT="gettext_po_sample_file.po.out"

var context={
	_:{LOCALE:'fr',NO_DEBUG:true},
	variable1:'VARIABLE 1',
	variable2:'VARIABLE 2',
	bananas:7,
	oranges:0
}
var testput
Liquid=Foxbat()
liquid=new Liquid()
console.log(process.cwd())
liquid.marmot.initialize('fr')
.then(async ()=>{
	const content = await fs.readFile(SAMPLE_FILE)
	const gt= await liquid.marmot.Load(content)
	const new_content= await liquid.marmot.Dump()
	await fs.writeFile(SAMPLE_FILE_OUT,new_content)
	await liquid.marmot.Put('phrase one','translated phrase one','/a/file.html')
	await liquid.marmot.Put('phrase two','translated phrase two default', '/test/test.html' )
	await liquid.marmot.Put('phrase two','translated phrase two specific','/test/test.html' )

	var head= await liquid.marmot.Put('we have one banana','translation of we have one banana',{context:'/test/test.html',rank:'singular',on:'value'} )
	await liquid.marmot.Put('we have no bananas','translation of we have no bananas',
		{context:'/test/test.html',rank:'empty',PhraseId:head.PhraseId,control:'value'} )
	await liquid.marmot.Put('we have {?bananas?} bananas','translation of we have {?bananas?}  bananas',
		{context:'/test/test.html',rank:'plural',PhraseId:head.PhraseId,control:'value'} )

	const plural_testput= await fs.readFile('./test/testput_plural.html')
	const singular_testput=await fs.readFile('./test/testput_singular.html')
	const empty_testput=await fs.readFile('./test/testput_empty.html')
	var output= await liquid.renderFile('./test/test.html',context)
	describe('plural', function () {
		assert.equal(output,plural_testput)
	});
	context.bananas=1
	output=await liquid.renderFile('./test/test.html',context)
	describe('singular', function () {
		assert.equal(""+output,""+singular_testput)
	});
	context.bananas=0
	output= await liquid.renderFile('./test/test.html',context)
	describe('empty', function () {
		assert.equal(""+output,""+empty_testput)
	});
	await liquid.marmot.sequelize.close()
	console.log("DONE")
})
