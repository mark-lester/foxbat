var patterns = [
	    ["identifier", /^[a-zA-Z_]\w*/],
	    ["string", /^"(\\\\|\\"|[^"])*"/],
	    ["string", /^'(\\\\|\\'|[^'])*'/],
	    ["comma", /^\,/],
	    ["equal", /^\=/],
	    ["other", /^[\s\S]/],
];

module.exports=function tagParse(input){
	var tokens=tokenize(input,patterns).filter(relevant)
	var output={}
	var control_variable
	expressions=toksplit(tokens,'comma')
	expressions.map((expression)=>{
		var [key,val]=toksplit(expression,'equal')
		.map((expression)=>{
			return expression.map(t=>t[1]).join()
		})

		if (val == undefined){
			val=key
			key='none'
		}
		// find var
		output[expandKey(key)]=val
		if (output.on){
			control_variable=output.on
			delete output.on
		}
		if (!control_variable && val != undefined)
			[control_variable,execution_phase]=controlVariable(val)
	})
	if (control_variable)
		expandRanks(output)

	return [output,control_variable,execution_phase]
}

function expandRanks(output){
	var filler=output.none || output.empty || output.singular || output.plural
	delete output.on
	delete output.none
	'empty singular plural'.split(/ /).forEach(rank=>{
		output[rank] = output[rank] || filler
	})
}

function controlVariable(phrase){
	var r=phrase.match(/{([\$\?\{])\s*([a-zA-Z_]\w*)\s*[\$\?\}]}/)
	if (!r || !r.length)
		return []

	var control_variable=r[2]
	var execution_phase
	switch (r[1]){
		case '?':
			execution_phase='once'
			break
		case '$':
			execution_phase='every'
			break
		case '{':
			execution_phase='client'
			break
	}
	return [control_variable,execution_phase]
}

function relevant(token){
	return token[0] != 'other'
}

function expandKey(key){
	switch (key){
		case 's':
			return 'singular'
		case 'p':
			return 'plural'
		case 'e':
			return 'empty'
		case 'o':
			return 'on'
	}
	return key
}

function toksplit(tokens,on){
	var out=[[]]
	while (tokens.length){
		if (tokens[0][0]==on){
			out.unshift([])
			tokens.shift()
			continue
		}
		out[0].push(tokens.shift())
	}
	return out.reverse()
}

function read_token(input, i, patterns) {
	for (var j = 0; j < patterns.length; j++) {
		var regex = patterns[j][1];
		var result = input.slice(i).match(regex);
		if (result !== null) {
			var text = result[0];
			var token = [j, i, text.length];
			return [token, i + text.length];
		}
	}
}

function tokenize(input, patterns) {
	var tokens = [];
	for (var i = 0; i < input.length;) {
		var result = read_token(input, i, patterns);
		var token = result[0];
		i = result[1];
		tokens.push(token);
	}
	return tokens
	.map(t=>[patterns[t[0]][0],input.substr(t[1],t[2])])
	.map(t=>{
		if (t[0] == 'string')
			t[1]=t[1].replace(/^"(.+(?="$))"$/, '$1')
		return t
	})
}
