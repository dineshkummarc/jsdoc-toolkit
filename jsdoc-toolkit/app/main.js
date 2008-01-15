var argj = arguments.pop();
var runscript;
if (argj.match(/^-j=(.+)/)) {
	runscript = RegExp.$1;
}
else {
	print("run with JsRun.");
	quit();
}

try { importClass(java.lang.System); }
catch (e) { throw "RuntimeException: The class java.lang.System is required to run this script."; }

/** @namespace */
SYS = {
	os: [
		System.getProperty("os.name"),
		System.getProperty("os.arch"),
		System.getProperty("os.version")
	],
	
	slash: System.getProperty("file.separator")||"/",
	userDir: System.getProperty("user.dir"),
	javaHome: System.getProperty("java.home"),
	
	pwd: function() {
		if (SYS._pwd) return SYS._pwd;
		
		var fname = runscript;
		var absPath = SYS.userDir+SYS.slash+fname;
		var pathParts = absPath.split(/\b[\\\/]/);
		var resolvedPath = [];
		for (var i = 0; i < pathParts.length; i++) {
			if (pathParts[i] == "..") resolvedPath.pop();
			else if (pathParts[i] != ".") resolvedPath.push(pathParts[i]);
		}
		
		resolvedPath.pop();
		var thisDir = /*SYS.slash+*/resolvedPath.filter(function($) { return !!$}).join("/");
		if (thisDir.charAt(thisDir.length-1) != SYS.slash) thisDir += "/";
		
		return SYS._pwd = thisDir;
	}
}

// shortcuts
var FileWriter = Packages.java.io.FileWriter;
var File = Packages.java.io.File;

/**
	@namespace
*/
IO = {
	saveFile: function(outDir, fileName, content) {
		var out = new Packages.java.io.PrintWriter(
			new Packages.java.io.OutputStreamWriter(
				new Packages.java.io.FileOutputStream(outDir+SYS.slash+fileName),
				IO.encoding
			)
		);
		out.write(content);
		out.flush();
		out.close();
	},

	readFile: function(path) {
		if (!IO.exists(path)) {
			throw new java.io.FileNotFoundException("File doesn't exist there: "+path);
		}
		return readFile(path, IO.encoding);
	},

	copyFile: function(inFile, outDir, fileName) {
		if (fileName == null) fileName = JSDOC.Util.fileName(inFile);
	
		var inFile = new File(inFile);
		var outFile = new File(outDir+SYS.slash+fileName);
		
		var bis = new Packages.java.io.BufferedInputStream(new Packages.java.io.FileInputStream(inFile), 4096);
		var bos = new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(outFile), 4096);
		var theChar;
		while ((theChar = bis.read()) != -1) {
			bos.write(theChar);
		}
		bos.close();
		bis.close();
	},

	mkPath: function(/**Array*/ path) {
		var make = "";
		for (var i = 0, l = path.length; i < l; i++) {
			make += path[i]+"/";
			if (! IO.exists(make)) {
				IO.makeDir(make);
			}
		}
	},

	makeDir: function(dirName) {
		(new File(dirName)).mkdir();
	},

	ls: function(dir, recurse, allFiles, path) {
		if (path === undefined) { // initially
			var allFiles = [];
			var path = [dir];
		}
		if (path.length == 0) return allFiles;
		if (recurse === undefined) recurse = 1;
		
		dir = new File(dir);
		if (!dir.directory) return [String(dir)];
		var files = dir.list();
		
		for (var f = 0; f < files.length; f++) {
			var file = String(files[f]);
			if (file.match(/^\.[^\.\/\\]/)) continue; // skip dot files
	
			if ((new File(path.join("/")+"/"+file)).list()) { // it's a directory
				path.push(file);
				if (path.length-1 < recurse) IO.ls(path.join("/"), recurse, allFiles, path);
				path.pop();
			}
			else {
				allFiles.push((path.join("/")+"/"+file).replace("//", "/"));
			}
		}
	
		return allFiles;
	},

	exists: function(path) {
		file = new File(path);
	
		if (file.isDirectory()){
			return true;
		}
		if (!file.exists()){
			return false;
		}
		if (!file.canRead()){
			return false;
		}
		return true;
	},

	open: function(path, append) {
		var append = true;
		var outFile = new Packages.java.io.File(path);
		var out = new Packages.java.io.PrintWriter(
			new Packages.java.io.OutputStreamWriter(
				new Packages.java.io.FileOutputStream(outFile, append),
				IO.encoding
			)
		);
		return out;
	},

	setEncoding: function(encoding) {
		if (/ISO-8859-([0-9]+)/i.test(encoding)) {
			IO.encoding = "ISO8859_"+RegExp.$1;
		}
		else {
			IO.encoding = encoding;
		}
	},

	/** @default "utf-8"
		@private
	 */
	encoding: "utf-8",
	
	include: function(relativePath) {
		load(SYS.pwd()+relativePath);
	},
	
	includeDir: function(path) {
		if (!path) return;
		
		for (var lib = IO.ls(SYS.pwd()+path), i = 0; i < lib.length; i++) 
			load(lib[i]);
	}
}
/*debug*///print("SYS.pwd() is "+SYS.pwd());

IO.include("frame.js");
IO.include("lib/JSDOC.js");
IO.includeDir("plugins/");
/*debug*///IO.include("frame/Dumper.js");

with (JSDOC) {
	var jsdoc = new JsDoc(arguments);
	var myTemplate = JSDOC.opt.t;

	var symbols = jsdoc.symbolGroup.getSymbols();
	for (var i = 0, l = symbols.length; i < l; i++) {
		var symbol = symbols[i];
		/*debug*///print(Dumper.dump(symbol));
		/*debug*///print("s> "+symbol.alias);
	}

	load(myTemplate+"/publish.js");
	publish(jsdoc.symbolGroup);
}
