const Foxbat=require('../index')
const foxbat = new Foxbat()
foxbat.loadHelpers()
const fs=require('fs').promises;
const assert = require('assert')

var context={
	locale:'fr',
	locale1:'LOCAL ONE',
	locale2:'LOCAL TWO',
}
var testput
fs.readFile('./test/testput.html')
.then((t)=>{
	testput=t
	return foxbat.execute('./test/test.html','fr',context)
	.then((output)=>{
		describe('FILE 1', function () {
			describe('Test 1', function () {
				assert.equal(output,testput)
			});
		});
	});
})
