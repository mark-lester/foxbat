const Foxbat=require('../index')
const fs=require('fs').promises;
const assert = require('assert')

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
.then(()=>{
	//ugh
	liquid.preliquid.marmot=liquid.marmot
})
.then(()=>{
	return liquid.marmot.Put('phrase one','translated phrase one','/a/file.html')
})
.then(()=>{
	return liquid.marmot.Put('phrase two','translated phrase two default', '/test/test.html' )
})
.then(()=>{
	return liquid.marmot.Put('phrase two','translated phrase two specific','/test/test.html' )
})
.then(()=>{
	return liquid.marmot.Put('we have one banana','translation of we have one banana','/test/test.html',{rank:'singular'} )
})
.then(()=>{
	return liquid.marmot.Put('we have no bananas','translation of we have no bananas','/test/test.html',{rank:'empty'} )
})
.then(()=>{
	return liquid.marmot.Put('we have {?bananas?} bananas','translation of we have {?bananas?}  bananas','/test/test.html',{rank:'plural'} )
})
.then(()=> fs.readFile('./test/testput_plural.html'))
.then((t)=>{
	plural_testput=""+t
})
.then(()=> fs.readFile('./test/testput_singular.html'))
.then((t)=>{
	singular_testput=""+t
})
.then(()=> fs.readFile('./test/testput_empty.html'))
.then((t)=>{
	empty_testput=""+t

	return liquid.renderFile('./test/test.html',context)
	.then((output)=>{
		describe('plural', function () {
			assert.equal(""+output,""+plural_testput)
		});
		context.bananas=1
		return liquid.renderFile('./test/test.html',context)
	})
	.then((output)=>{
		describe('singular', function () {
			assert.equal(""+output,""+singular_testput)
		});
		context.bananas=0
		return liquid.renderFile('./test/test.html',context)
	})
	.then((output)=>{
		describe('empty', function () {
			assert.equal(""+output,""+empty_testput)
		});
	})
})
