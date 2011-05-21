var formidable = require('formidable');

var http = require('http');
var url  = require('url');
var path = require("path");
var fs   = require('fs');

var os   = require('os');
var sys  = require('sys');
var exec = require('child_process').exec;

var fileMarkerToken = "//$$GUI$$ DO NOT EDIT ANYTHING BELOW";


// how to execute children
/*var child;
  child = exec("pwd", function (error, stdout, stderr) {
  sys.print('stdout: ' + stdout);
  sys.print('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});*/

var GsServerLib = {
	postCallback: function(request, callback) {
	    var content = '';

	    if (request.method == 'POST') {
	    	request.addListener('data', function(chunk) {
	    		content += chunk;
	    		});
	    	request.addListener('end', function() {
	    		callback(content);
	    		});
	    	};
	},
	
	getMimeType: function(url) {
		switch (url.substring(url.lastIndexOf("."))) {
			case ".jpg": return "image/jpeg";
			case ".gif": return "image/gif";
			case ".png": return "image/png";
			case ".css": return "text/css";
			case ".html" || ".htm": return "text/html";
			case ".js": return "text/javascript";
			case ".ogg": return "audio/ogg";
			case ".mp3": return "audio/mp3";
			case ".wav": return "audio/wav";
			case ".xml": return "text/xml";
			case ".ogv": return "application/ogg";
			case ".full": return "video/mp4";
			case ".mobile": return "video/mp4";
			case ".mp4": return "video/mp4";
			default: return "text/plain";
		}
	},
	
	sliceFile: function(url, bounds, stats, success) {
		if (!bounds) bounds = { start: 0, end: 0 };
		if (!bounds.start) bounds.start = 0;
		if (!bounds.end) bounds.end = 0;

		var start= bounds.start;
		var end  = bounds.end;

		start = Math.max(Math.min(start, stats.size), 0);
		if (end === 0 || end < start || end > stats.size)
			end = stats.size;

		var buffer = new Buffer(end - start);
		var count = 0;
		var stream = fs.createReadStream(url, { start: start, end: end });
		stream.on("data", function(data) {
			data.copy(buffer, count);
			count += data.length;
		});
		stream.on("end", function() {
			success(buffer, stats.size, GsServerLib.getMimeType(url));
		});
	},
	
	updateMainGameFile: function(gameName) {
		//get includes
		fs.readdir("./games/"+gameName+"/code", function(err, files) {
			var jsIncludes = "";
			for(var i=0; i < files.length; i+=1) {
				if (files[i].slice(files[i].lastIndexOf(".")) === ".js") {
					jsIncludes += "<script type=\"text/javascript\" src=\"./code/"+files[i]+"\"></script>\n	";
				}
			}
			
			fs.readdir("./games/"+gameName+"/rooms", function(err, files) {
				for(var i=0; i < files.length; i+=1) {
					if (files[i].slice(files[i].lastIndexOf(".")) === ".js") {
						jsIncludes += "<script type=\"text/javascript\" src=\"./rooms/"+files[i]+"\"></script>\n	";
					}
				}
				
				fs.readFile("./generic-star/node/templates/Main.html", "utf8", function(err, file) {
				    if (err) {
				    	console.err("Error: Missing Main.html Template! Game will not be updated.");
				        return;
				    }
				    
				    file = file.replace(/\$\$GAME_NAME\$\$/g, gameName);
				    file = file.replace(/\$\$GAME_INCLUDES\$\$/g, jsIncludes);
				    
				    var writeFile = "./games/"+gameName+"/Main.html";
				    fs.writeFile(writeFile, file, function(err) {
				    	if (err) {
	    			    	console.err("Error: could not write game ["+gameName+"] Main.html file!");
	    			    }
				    });
				});
			});
		});
	}
};

// start server
var curSel = null;
http.createServer(function(req, response) {
    var request = url.parse(req.url);
    
    //COMMAND SEQUENCES ===========================================
    if (request.pathname === "/action") {
    	GsServerLib.postCallback(req, function(content) {
    		var cmd = JSON.parse(content);
    		var ret = new Object();
    		ret.err = new Array();
    		function addErr(err) {
    			if (err !== null) ret.err.push(err);
    		};
    		
    		var respond = function() {
    			response.writeHead(200);
	    		response.end(JSON.stringify(ret));
    		};
    		
    		//create new game
    		if (cmd.cmd === "new") {
    			if (path.existsSync("./games/"+cmd.name)) {
    				addErr("Already Exists");
    				respond();
    				return;
    			}
    			
    			fs.mkdirSync("./games/"+cmd.name, 0755);
    			fs.mkdirSync("./games/"+cmd.name+"/images", 0755);
    			fs.mkdirSync("./games/"+cmd.name+"/sounds", 0755);
    			fs.mkdirSync("./games/"+cmd.name+"/code", 0755);
    			fs.mkdirSync("./games/"+cmd.name+"/rooms", 0755);
    			GsServerLib.updateMainGameFile(cmd.name);
    			
    			respond();
	    		
    		//rename a file
    		} else if (cmd.cmd === "rn") {
    			var fn1 = "./games/" + cmd.game + "/" + cmd.type + "/" + cmd.fnFrom;
    			var fn2 = "./games/" + cmd.game + "/" + cmd.type + "/" + cmd.fnTo;
    			if (!path.existsSync(fn1)) {
    				addErr(404);
    				respond();
    				return;
    			}
    			
    			if (path.existsSync(fn2)) {
    				addErr(409);
    				respond();
    				return;
    			}
    			
    			fs.rename(fn1, fn2, function(e) {
    				addErr(e);
    				respond();
    			});
    			
			//delete a file
    		} else if (cmd.cmd === "rm") {
    			var fn = "./games/" + cmd.game + "/" + cmd.type + "/" + cmd.fn;
    			if (!path.existsSync(fn)) {
    				addErr(404);
    				respond();
    				return;
    			}
    			
    			fs.unlink(fn, function(e) {
    				addErr(e);
    				respond();
    			});
    			
			//select a game from the drop down
    		} else if (cmd.cmd === "select") {
    			curSel = cmd.selected;
    			response.writeHead(200);
	    		response.end("ok");
    			
			//ls command
    		} else if (cmd.cmd === "ls") {
    			ret.games = new Array();
    			ret.images= new Array();
    			ret.sounds= new Array();
    			ret.code  = new Array();
    			ret.codeParams = new Object();
    			ret.rooms = new Array();
    			ret.roomParams = new Object();
    			
    			var lsCode = function(type, dir, files, addFiles, addData, callback) {
    				if (files.length > 0) {
    					var fileNm = files.shift();
    					var ext = fileNm.slice(fileNm.lastIndexOf("."));
    					addFiles.push(fileNm);
    					if (ext === ".js") {
    						fs.readFile(dir+"/"+fileNm, "utf8", function(err, file) {
        					    if (err) console.error("Error: Could not read file: "+file+" in game "+dir);
        					    else {
        					    	var sToken = (type === "code") ? "(" : "=";
        					    	var eToken = (type === "code") ? ");": ";";
        					    	var start = file.indexOf(sToken, file.indexOf("\n", file.lastIndexOf(fileMarkerToken)));
            					    var end   = file.lastIndexOf(eToken);
            					    if (end === -1) end = file.length;
            					    addData[fileNm] = JSON.parse(file.slice(start+1,end).trim());
        					    }
        					    
        					    lsCode(type, dir, files, addFiles, addData, callback);
        					});
    						
    					} else {
    						lsCode(type, dir, files, addFiles, addData, callback);
    					}
    				} else {
    					callback();
    				}
    			};
    			
    			var ls = function(dir, arr, match, callback, code, rooms) {
    				fs.readdir(dir, function(err, files) {
    					addErr(err);
    					if (code) {
    						lsCode("code", dir, files, arr, ret.codeParams, callback);
    					} else if (rooms) {
    						lsCode("rooms", dir, files, arr, ret.roomParams, callback);
    					} else {
    						for(var i=0; i<files.length; i++) {
        						if (files[i].match(match) !== null) arr.push(files[i]);
        					}
    						arr.sort();
        					callback();
    					}
    				});
    			};
    			
    			if (cmd.game === undefined) {
    				ls("./games", ret.games, /^[^\..]*$/, function() {
    					if (curSel === null) curSel = ret.games[0];
    					ret.selected = curSel;
    					respond();
    				});
    				
    			} else {
    				var regex = {
    					images: /\.(gif|png|jpg|jpeg)$/,
    					sounds: /\.(mp3|ogg|wav)$/,
    					code:   /\.(js)$/
    				};
    				var dir = "./games/"+unescape(cmd.game);
    				
    				if (cmd.type === undefined) {
    					ls(dir+"/images", ret.images, regex.images, function() {
    						ls(dir+"/sounds", ret.sounds, regex.sounds, function() {
        						ls(dir+"/code", ret.code, regex.code, function() {
        							ls(dir+"/rooms", ret.rooms, regex.code, function() {
        								respond();
        							}, false, true);
        						}, true);
    						}, false);
    					}, false);
    				} else {
						ls(dir+"/"+cmd.type, ret[cmd.type], regex[cmd.type], function() {
							respond();
						}, cmd.type === "code", cmd.type === "rooms");
    				}
    			}
    			
			//Make Code Command
    		} else if (cmd.cmd === "mkCode") {
    			var writePath = "./games/"+curSel+"/code/"+cmd.name+".js";
				fs.readFile("./generic-star/node/templates/"+cmd.type+".js", "utf8", function(err, file) {
    			    if (err) {
    			    	console.err("Error: Missing file ./generic-star/node/templates/"+cmd.type+".js");
    			    	addErr(500);
    			    	respond();
    			        return;
    			    }
    			    
    			    file = file.replace(/\$\$GAME_NAME\$\$/g, curSel);
    			    file = file.replace(/\$\$OBJECT_NAME\$\$/g, cmd.name);
    			    file += "\n\n"+fileMarkerToken+"\n"+
    			    		curSel+"."+cmd.name+".prototype.init("+cmd.settings+");";
																					        			    
    			    fs.writeFile(writePath, file, function(err) {
    			    	if (err) {
        			    	addErr(500);
        			    	respond();
        			        return;
        			    }
    			    	
    			    	GsServerLib.updateMainGameFile(curSel);
    			    	respond();
    			    });
    			});
				
			//make new room
    		} else if (cmd.cmd === "mkRoom") {
    			var writePath = "./games/"+curSel+"/rooms/"+cmd.name+".js";
    			var file = "\n\n"+fileMarkerToken+"\n";
			    file += curSel+".Rooms."+cmd.name+" = "+cmd.settings+";";
																				        			    
			    fs.writeFile(writePath, file, function(err) {
			    	if (err) {
    			    	addErr(500);
    			    	respond();
    			        return;
    			    }
			    	GsServerLib.updateMainGameFile(curSel);
			    	respond();
			    });
    		}
    		
    		
    	});
    
	//FILE UPLOAD ===========================================
	
    } else if (request.pathname.substr(0, 7) === "/upload") {
    	var form = new formidable.IncomingForm();
	    form.uploadDir = path.join(__dirname, 'tmp');
	    
	    var mvDir = request.pathname.slice(7);

		form.on('file', function(field, file) {
			var mvTo = "."+unescape(mvDir)+"/"+unescape(file.name);
			if (path.existsSync(mvTo)) {
				fs.unlinkSync(mvTo);
			}
			fs.renameSync(file.path, mvTo);
		});

		form.on('end', function() {
			response.writeHead(200, {
				'content-type' : 'text/plain'
			});
			response.end("ok");
		});

		form.parse(req);
	    
    	
	//FILE REQUEST ===========================================
    } else {
    	var filename = unescape("."+request.pathname);
        if (filename.length <= 2) {
        	response.writeHead(302, {'Location': 'generic-star/node/editor.html'});
    		response.end("302 Redirect\n");
    		return;
        }
        
        path.exists(filename, function(exists) {
            if(!exists) {
        		response.writeHead(404, {"Content-Type": "text/plain"});
                response.end("404 Not Found\nFile Request: "+filename+"\n");
                return;
            }
            
            fs.stat(filename, function(err, stat) {
            	if(err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.end(err + "\n");
                    return;
                }
            	
            	//handle streaming media
            	if (req.headers.range !== undefined) {
            		var range = req.headers.range;

            		var parts = range.replace(/bytes=/, "").split("-");
            		var bounds = {
        				start: parseInt(parts[0], 10),
        				end:   parts[1] ? parseInt(parts[1], 10) : 0
    				};
            		
            		GsServerLib.sliceFile(filename, bounds, stat, function(file, totalsize, type) {
            			var headers = {
        					"Content-Range":  "bytes " + bounds.start + "-" + bounds.end + "/" + totalsize,
        					"Accept-Ranges":  "bytes",
        					"Content-Length": file.length,
        					"Content-Type":   type
            			};
            			response.writeHead(206, headers);
            			response.end(file);
            		});
            		
        		//handle static files
            	} else {
            		fs.readFile(filename, "binary", function(err, file) {
                        if(err) {
                            response.writeHead(500, {"Content-Type": "text/plain"});
                            response.end(err + "\n");
                            return;
                        }
                        
                        response.setHeader('Content-Length', stat.size);
                    	response.setHeader('Content-Type', GsServerLib.getMimeType(filename));
                    	response.writeHead(200);
                        response.end(file, "binary");
                    });
            	}
            	
            	
            });
        });
            
    }

}).listen(8787);

fs.readFile("./generic-star/node/server.txt", "utf8", function(err, file) {
    if(err) {
    	console.error("Error: Generic Star could not read the intro file.\n");
        console.error(err + "\n");
        return;
    }

    console.log(file);
});