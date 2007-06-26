SYM = {
	OBJECT:			"OBJECT",
	FUNCTION:		"FUNCTION",
	CONSTRUCTOR:	"CONSTRUCTOR",
	VIRTUAL:		"VIRTUAL",
};

/** @constructor */
function Symbol(name, params, isa, comment) {
	this.name = name;
	this.params = (params || []);
	this.isa = (isa || SYM.OBJECT);
	
	this.alias = name;
	this.desc = "";
	this.memberof = undefined;
	this.properties = [];
	this.methods = [];
	this.doc = new Doclet(comment);
	
	// move certain data out of the tags and into the Symbol
	var overviews;
	if ((overviews = this.doc.getTag("overview")) && overviews.length) {
		var libraries;
		if ((libraries = this.doc.getTag("library")) && libraries.length) {
			this.name = libraries[0].desc;
			this.doc.dropTag("library");
		}
		
		this.desc = overviews[0].desc;
		this.doc.dropTag("overview");
	}
	else {
		var descs;
		if ((descs = this.doc.getTag("desc")) && descs.length) {
			this.desc = descs[0].desc;
			this.doc.dropTag("desc");
		}
		
		var params;
		if ((params = this.doc.getTag("param")) && params.length) { // user defined params override those defined by parser
			this.params = params;
			this.doc.dropTag("param");
		}
		else { // promote parser params into DocTag objects
			for (var i = 0; i < this.params.length; i++) {
				this.params[i] = new DocTag("param "+this.params[i]);
			}
		}
		
		var constructors;
		if ((constructors = this.doc.getTag("constructor")) && constructors.length) {
			this.isa = SYM.CONSTRUCTOR;
			this.doc.dropTag("constructor");
		}
		
		var functions;
		if ((functions = this.doc.getTag("function")) && functions.length) {
			this.isa = SYM.FUNCTION;
			this.doc.dropTag("function");
		}
		
		var methods;
		if ((functions = this.doc.getTag("method")) && functions.length) {
			this.isa = SYM.FUNCTION;
			this.doc.dropTag("method");
		}
		
		var names;
		if ((names = this.doc.getTag("name")) && names.length) {
			this.name = names[0].desc;
			this.doc.dropTag("name");
		}
		
		var properties;
		if ((properties = this.doc.getTag("property")) && properties.length) {
			for (var i = 0; i < properties.length; i++) {
				properties[i].alias = this.alias+"."+properties[i].name;
				this.properties.push(properties[i]);
			}
			this.doc.dropTag("property");
		}
		
		var types;
		if ((types = this.doc.getTag("type")) && types.length) {
			this.type = types[0].desc; // multiple type tags are ignored
			this.doc.dropTag("type");
		}
		
		if (this.isa == SYM.VIRTUAL) this.isa = SYM.OBJECT;
	}
	
}

/*Symbol.prototype.toString = function() {
	return "[object Symbol]";
}
*/
Symbol.prototype.is = function(what) {
    return this.isa === SYM[what];
}