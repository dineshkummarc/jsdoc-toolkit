function publish(symbolSet) {
    var outputDir = JSDOC.opt.d,
        outputFile = JSDOC.opt.D.outputFile || 'docs.json',
        projectSlug = JSDOC.opt.D.projectSlug,
        projectName = JSDOC.opt.D.projectName,
        versionNumber = JSDOC.opt.D.versionNumber,
        templatesDir = JSDOC.opt.t || SYS.pwd+"../templates/jsdoc-rails/";

    // is source output is suppressed, just display the links to the source file
    if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
        Link.prototype._makeSrcLink = function(srcFilePath) {
            return "&lt;"+srcFilePath+"&gt;";
        }
    }
    
    // used to allow Link to check the details of things being linked to
    Link.symbolSet = symbolSet;

    // some ustility filters
    function hasNoParent($) {return ($.memberOf == "")}
    function isaFile($) {return ($.is("FILE"))}
    function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace)}
    
    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();
    
     // get a list of all the classes in the symbolset
     var classes = symbols.filter(isaClass).sort(makeSortby("alias"));

    classes.map(function($) {
        $.tag = $.alias.replace(/[\.#]+/g, '__');
        $.symbolType = '';
        if ($.isNamespace) {
            if ($.is('FUNCTION')) {
                $.symbolType = "function";
            }
            $.symbolType = "namespace";
        } else {
            $.symbolType = "class";
        }

        $.extendsList = $.augments.sort().join(", ");

        $.events = $.getEvents();   // 1 order matters
        $.methods = $.getMethods(); // 2
    });
    
    var outputData = { classes: {}
                     , methods: {}
                     , properties: {}
                     , params: {}
                     , events: {}
                     , exceptions: {}
                     , examples: {}
                     , returns: {}
                     , sees: {}
                     }

    function addParams(sym) {
        if (sym.params) for (var i=0; i<sym.params.length; i++) {
            var p = sym.params[i]
            outputData.params[sym.alias + '(' + p.name + ')'] = extractProps(sym, ['name', 'defaultValue', 'type'])
            outputData.params[sym.alias + '(' + p.name + ')'].description = !!sym.isOptional
            outputData.params[sym.alias + '(' + p.name + ')'].description = sym.desc
            outputData.params[sym.alias + '(' + p.name + ')'].order = i
        }
    }

    function addExamples (sym) {
        if (sym.examples) for (var i=0; i<sym.examples.length; i++) {
            var e = sym.examples[i]
            outputData.examples[sym.alias] = outputData.examples[sym.alias] || []
            outputData.examples[sym.alias].push(e)
        }
    }
    function addExceptions (sym) {
        if (sym.exceptions) for (var i=0; i<sym.exceptions.length; i++) {
            var e = sym.exceptions[i]
            outputData.exceptions[sym.alias] = outputData.exceptions[sym.alias] || []
            outputData.exceptions[sym.alias].push({type: e.type, description: e.desc})
        }
    }

    function addRequires (sym) {
        if (sym.requires) for (var i=0; i<sym.requires.length; i++) {
            var r = sym.requires[i]
            outputData.requires[sym.alias] = outputData.requires[sym.alias] || []
            outputData.requires[sym.alias].push(r)
        }
    }

    function addSees (sym) {
        if (sym.see) for (var i=0; i<sym.see.length; i++) {
            var s = sym.see[i]
            outputData.sees[sym.alias] = outputData.sees[sym.alias] || []
            outputData.sees[sym.alias].push(s)
        }
    }


    classes.forEach(function (sym) {
        var ownProperties      = sym.properties.filter(function($) { return $.memberOf == sym.alias && !$.isNamespace; })
          , ownMethods         = sym.methods.filter(function($)    { return $.memberOf == sym.alias && !$.isNamespace; })
          , ownEvents          = sym.events.filter(function($)     { return $.memberOf == sym.alias && !$.isNamespace; })
          , borrowedProperties = sym.properties.filter(function($) { return $.memberOf != sym.alias; })
          , borrowedMethods    = sym.methods.filter(function($)    { return $.memberOf != sym.alias; })
          , borrowedEvents     = sym.events.filter(function($)     { return $.memberOf != sym.alias; })

        outputData.classes[sym.alias] = extractProps(sym, ['name', 'alias', 'memberOf', 'symbolType', 'version', 'extendsList', 'srcFile', 'since'])
        outputData.classes[sym.alias].deprecated = !!sym.deprecated
        outputData.classes[sym.alias].deprecatedDescription = sym.deprecated
        outputData.classes[sym.alias].description = sym.desc
        outputData.classes[sym.alias].classDescription = sym.classDesc

        if (!sym.isBuiltin() && sym.is('CONSTRUCTOR')) {
            outputData.methods[sym.alias] = extractProps(sym, ['name', 'alias', 'memberOf', 'isPrivate', 'isInner', 'isStatic', 'version', 'author', 'since'])
            outputData.methods[sym.alias].description = sym.desc
            outputData.methods[sym.alias].functionType = 'constructor'
        }

        addParams(sym)
        addExamples(sym)
        addExceptions(sym)
        addRequires(sym)
        addSees(sym)

        var i
        if (ownMethods) for (i=0; i<ownMethods.length; i++) {
            var mem = ownMethods[i]

            outputData.methods[mem.alias] = extractProps(mem, ['name', 'alias', 'memberOf', 'isPrivate', 'isInner', 'isStatic', 'version', 'author', 'since'])
            outputData.methods[mem.alias].description = mem.desc
            outputData.methods[mem.alias].type = 'method'

            addParams(mem)
            addExamples(mem)
            addExceptions(mem)
            addRequires(mem)
            addSees(mem)
        }

        if (ownProperties) for (i=0; i<ownProperties.length; i++) {
            var prop = ownProperties[i]

            outputData.properties[prop.alias] = extractProps(prop, ['name', 'alias', 'memberOf', 'isPrivate', 'isInner', 'isStatic', 'isConstant', 'isReadable', 'isWritable', 'srcFile', 'type', 'author', 'since', 'defaultValue', 'version'])
            outputData.properties[prop.alias].deprecated = !!sym.deprecated
            outputData.properties[prop.alias].deprecatedDescription = sym.deprecated
            outputData.properties[prop.alias].description = sym.desc
            addExamples(prop)
            addSees(prop)
        }

        if (ownEvents) for (i=0; i<ownEvents.length; i++) {
            var mem = ownEvents[i]

            outputData.events[mem.alias] = extractProps(mem, ['name', 'alias', 'memberOf', 'isPrivate', 'isInner', 'isStatic', 'version', 'author', 'since'])
            outputData.events[mem.alias].description = mem.desc
            outputData.events[mem.alias].type = 'method'

            addParams(mem)
            addExamples(mem)
            addExceptions(mem)
            addRequires(mem)
            addSees(mem)
        }

        if (ownProperties) for (i=0; i<ownProperties.length; i++) {
            var mem = ownProperties[i]

            outputData.properties[mem.alias] = extractProps(mem, ['name', 'alias', 'memberOf', 'isPrivate', 'isInner', 'isStatic', 'isConstant', 'isReadable', 'isWritable', 'srcFile', 'type', 'author', 'since', 'defaultValue', 'version'])
            outputData.properties[mem.alias].deprecated = !!sym.deprecated
            outputData.properties[mem.alias].deprecatedDescription = sym.deprecated
            outputData.properties[mem.alias].description = sym.desc
            addExamples(mem)
            addSees(mem)
        }

        outputData.classes[sym.alias].borrowed = outputData.classes[sym.alias].borrowed || {methods: [], properties: [], events: []}
        var borrowed = outputData.classes[sym.alias].borrowed
        if (borrowedMethods) for (i=0; i<borrowedMethods.length; i++) {
            var mem = borrowedMethods[i]
            borrowed.methods.push(mem.alias)
        }

        if (borrowedProperties) for (i=0; i<borrowedProperties.length; i++) {
            var mem = borrowedProperties[i]
            borrowed.properties.push(mem.alias)
        }

        if (borrowedEvents) for (i=0; i<borrowedEvents.length; i++) {
            var mem = borrowedEvents[i]
            borrowed.events.push(mem.alias)
        }
    });

    var output = JSON.stringify(outputData);
    IO.saveFile(outputDir, outputFile, output);
}


/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
function summarize(desc) {
    if (typeof desc != "undefined")
        return desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i)? RegExp.$1 : desc;
}

/** Make a symbol sorter by some attribute. */
function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    }
}

/** Pull in the contents of an external file at the given path. */
function include(path) {
    var path = publish.conf.templatesDir+path;
    return IO.readFile(path);
}

/** Turn a raw source file into a code-hilited page in the docs. */
function makeSrcFile(path, srcDir, name) {
    if (JSDOC.opt.s) return;
    
    if (!name) {
        name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
        name = name.replace(/\:/g, "_");
    }
    
    var src = {path: path, name:name, charset: IO.encoding, hilited: ""};
    
    if (defined(JSDOC.PluginManager)) {
        JSDOC.PluginManager.run("onPublishSrc", src);
    }

    if (src.hilited) {
        IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
    }
}

/** Build output for displaying function parameters. */
function makeSignature(params) {
    if (!params) return "()";
    var signature = "("
    +
    params.filter(
        function($) {
            return $.name.indexOf(".") == -1; // don't show config params in signature
        }
    ).map(
        function($) {
            return $.name;
        }
    ).join(", ")
    +
    ")";
    return signature;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, from) {
    str = str.replace(/\{@link ([^} ]+) ?\}/gi,
        function(match, symbolName) {
            return new Link().toSymbol(symbolName);
        }
    );
    
    return str;
}

function indentString(str, indent) {
    var indentStr = '';
    for (var i=0; i<indent; i++) {
        indentStr += ' ';
    }

    return indentStr + str.replace(/\n/g, "\n" + indentStr);
}

function toYAML(obj, indent) {
    indent = indent || 0;

    var output = '';
    for (var key in obj) {
        var val = obj[key];

        output += key + ": "

        switch (typeof(val)) {
        case 'object':
            output += "\n"
            output += toYAML(val, indent +2);
            break;
        case 'string':
            if (val != '') {
                output += '"' + val.replace(/"/g, '\\"') + '"';
            }
            break;

        case 'undefined':
            break;
        default:
            output += val.toString();
            break;
        }
        output += "\n";
    }


    output = indentString(output, indent);

    return output;
}
function extractProps (obj, props) {
    var newObj = {}
    for (var i = 0, len = props.length; i < len; i++) {
        var p = props[i]
          , v = obj[p]
        if (typeof v == 'undefined') v = null
        newObj[p] = v
    }

    return newObj
}

var JSON = {
    stringify: function (obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"'+ obj.replace(/\\/g, '\\\\').replace(/\n/g, "\\n").replace(/"/g, '\\"') +'"';
            return String(obj);
        }
        else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);
            for (n in obj) {
                v = JSON.stringify(obj[n]);
                json.push((arr ? "" : '"' + n + '": ') + String(v));
            }
            return (arr ? "[\n" : "{\n") + json.join(',\n') + (arr ? "\n]" : "\n}");
        }
    },
    parse: function (json) {
        return eval('(' + json + ')')
    }
}
