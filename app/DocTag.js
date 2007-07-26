/**
 * @fileOverview Represents a tag within a doclet.
 * @name DocTag
 * @author Michael Mathews <a href="mailto:micmath@gmail.com">micmath@gmail.com</a>
 * @revision $Id$
 * @license <a href="http://en.wikipedia.org/wiki/MIT_License">X11/MIT License</a>
 *          (See the accompanying README file for full details.)
 */
 
 /**
 * @constructor
 * @param {string} src line(s) of text following the @ chracter
 */
function DocTag(src) {
	/** Like @title */
	this.title = "";
	
	/** Like @title {type} */
	this.type = "";
	
	/** Like @title {type}? name, though this is only recognized in tags with a title of "param" or "property." */
	this.name = "";
	
	/** Like @title {type}? name? description goes here... */
	this.desc = "";
	
	if (typeof(src) != "undefined") {
		var parts = src.match(/^(\S+)(?:\s+\{\s*([\S\s]+?)\s*\})?\s*([\S\s]*\S)?/);
		
		this.title = (parts[1].toLowerCase() || "");
		this.type = (parts[2] || "");
	
		if (this.type) this.type = this.type.replace(/\s*(,|\|\|?)\s*/g, ", ");
		this.desc = (parts[3] || "");
		
		// should be @type foo but we'll accept @type {foo} too
		if (this.title == "type") {
			if (this.type) this.desc = this.type;
			
			// should be @type foo, bar, baz but we'll accept @type foo|bar||baz too
			if (this.desc) {
				this.desc = this.desc.replace(/\s*(,|\|\|?)\s*/g, ", ");
			}
		}
		
		// tag synonyms here
		if (this.title == "member") this.title = "memberof";
		else if (this.title == "description") this.title = "desc";
		else if (this.title == "exception") this.title = "throws";
		else if (this.title == "argument") this.title = "param";
		else if (this.title == "returns") this.title = "return";
		else if (this.title == "classdescription") this.title = "class";
		else if (this.title == "fileoverview") this.title = "overview";
		else if (this.title == "projectdescription") this.title = "overview";
		else if (this.title == "extends") this.title = "inherits";
		else if (this.title == "base") this.title = "inherits";
		
		if (this.desc) {
			if (this.title == "param") { // long tags like {type} [name] desc
				var m = this.desc.match(/^\s*(\[?)([a-zA-Z0-9.$_]+)(\]?)(?:\s+([\S\s]*\S))?/);
				if (m) {
					this.isOptional = (!!m[1] && !!m[3]); // bracketed name means optional
					this.name = (m[2] || "");
					this.desc = (m[4] || "");
				}
			}
			else if (this.title == "property") {
				m = this.desc.match(/^\s*([a-zA-Z0-9.$_]+)(?:\s+([\S\s]*\S))?/);
				if (m) {
					this.name = (m[1] || "");
					this.desc = (m[2] || "");
				}
			}
		}
	}
}

DocTag.prototype.toString = function() {
	return this.desc;
}
