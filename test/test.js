const Foxbat=require('../index')
const fs=require('fs').promises;
const assert = require('assert')

var context={
	_:{LOCALE:'fr'},
	variable1:'VARIABLE 1',
	variable2:'VARIABLE 2',
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
.then(()=> fs.readFile('./test/testput.html'))
.then((t)=>{
	testput=""+t
	return liquid.renderFile('./test/test.html',context)
	.then((output)=>{
		console.log("OUTPUT="+output)
		console.log("TESTPUT="+testput)
		describe('FILE 1', function () {
			describe('Test 1', function () {
				assert.equal(""+output,""+testput)
			});
		});
	});
})
