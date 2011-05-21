GenericStar.Editor = new Object();

// =============== LIBRARY ===============
XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
    function byteValue(x) {
        return x.charCodeAt(0) & 0xff;
    }
    var ords = Array.prototype.map.call(datastr, byteValue);
    var ui8a = new Uint8Array(ords);
    this.send(ui8a.buffer);
};

/**
 * Creates an instance of the GS Editor Library.
 * @class Handles miscellaneous javascript and networking functionality.
 */
GenericStar.Editor.Library = function() {};

/**
 * Given a string value, restrict the value to valid
 * configurations for a game / file name.
 * @param {Object} dom a container for setting variables
 * @param {Number} dom.maxLength the maximum length to restrict to
 * @param {String} dom.value the value to restrict
 * @param {Boolean} isEntered if true, this filter is being
 * 		used after typing is complete (not correct as-you-type) 
 * @returns {String} the filtered name
 */
GenericStar.Editor.Library.prototype.filenameFilter = function(dom, isEntered) {
	var name = dom.value;
	var MAX_LENGTH = parseInt(dom.maxLength);
	name = name.replace(/[^A-Za-z0-9-\s\(\)_]/g, "");
	name = name.slice(0, MAX_LENGTH);
	if (isEntered) name = name.trim();
	return name;
};

/**
 * Tells if a string is a javascript keyword / reserved word.
 * @param {String} str the string to check against
 * @returns {Boolean} true if a keyword
 */
GenericStar.Editor.Library.prototype.isKeyword = function(str) {
	return str === "case" ||
		str === "break" ||
		str === "const" ||
		str === "continue" ||
		str === "delete" ||
		str === "do" ||
		str === "while" ||
		str === "export" ||
		str === "for" ||
		str === "in" ||
		str === "function" ||
		str === "if" ||
		str === "else" ||
		str === "import" ||
		str === "instanceOf" ||
		str === "label" ||
		str === "let" ||
		str === "new" ||
		str === "return" ||
		str === "switch" ||
		str === "this" ||
		str === "throw" ||
		str === "try" ||
		str === "catch" ||
		str === "typeof" ||
		str === "var" ||
		str === "void" ||
		str === "while" ||
		str === "with" ||
		str === "yield";
};

/**
 * Given a string value, restrict the value to valid
 * configurations for a programming construct name.
 * @param {Object} dom a container for setting variables
 * @param {Number} dom.maxLength the maximum length to restrict to
 * @param {String} dom.value the value to restrict
 * @param {Boolean} isEntered if true, this filter is being
 * 		used after typing is complete (not correct as-you-type) 
 * @returns {String} the filtered name
 */
GenericStar.Editor.Library.prototype.programmingFilter = function(dom, isEntered) {
	var name = dom.value;
	var MAX_LENGTH = parseInt(dom.maxLength);
	name = name.replace(/[^A-Za-z0-9_]/g, "");
	name = name.replace(/^[0-9]+/g, "");
	name = name.slice(0, MAX_LENGTH);
	if (isEntered) {
		name = name.trim();
		if (this.isKeyword(name)) name = "";
	}
	return name;
};

/**
 * Checks if a value is in an array. O(n) 
 * time in the length of the array.
 * @param {Array} array array to check
 * @param {Object} value value to check for in the array
 * @returns {Boolean} true if that value is in the array
 */
GenericStar.Editor.Library.prototype.inArr = function(array, value) {
	for(var i=0; i<array.length; i++) {
		if (array[i] === value) return true;
	}
	return false;
};

/**
 * Constructs a DOM Node containing a given thumbnail image.
 * @param {String} imgUrl the path to the image to display
 * @return {Node} the DOM node constructed
 */
GenericStar.Editor.Library.prototype.createImageThumb = function(imgUrl) {
	var thumb = document.createElement("img");
	thumb.className = "thumb";
	thumb.src = imgUrl;
	var thumbCell = document.createElement("div");
	thumbCell.className = "thumb";
	var thumbTable= document.createElement("div");
	thumbTable.className = "thumbContainer";
	
	thumbCell.appendChild(thumb);
	thumbTable.appendChild(thumbCell);
	
	return thumbTable;
};

/**
 * Constructs a DOM Node containing a playable sound thumbnail.
 * @param {String} soundUrl the URL of the sound to play
 * @param {GenericStar.Editor.DomHelper} domLib an instance of DOM Helper
 * @return {Node} the DOM node constructed
 */
GenericStar.Editor.Library.prototype.createSoundThumb = function(soundUrl, domLib) {
	var isPlaying = false;
	var player = document.createElement("div");
	player.className = "button2 soundPlayer";
	player.innerHTML = "&#9654;"; //&#9632;
	
	var sound = document.createElement('audio');
	sound.className = "soundAudio";
	sound.src = soundUrl;
	sound.load();
	sound.loop = false;
	
	var setIsPlaying = function(newPlaying) {
		if (!newPlaying) {
			player.innerHTML = "&#9654;";
			domLib.remClass(player, "soundPlayerPaused");
			sound.pause();
			sound.currentTime = 0;
			
		} else {
			player.innerHTML = "&#9632;";
			domLib.addClass(player, "soundPlayerPaused");
			sound.play();
		}
		
		isPlaying = newPlaying;
	};
	
	sound.addEventListener("ended", function(e) {
		setIsPlaying(false);
	}, false);
	
	player.addEventListener("click", function(e) {
		setIsPlaying(!isPlaying);
	}, false);
	
	player.appendChild(sound);
	
	return player;
};

/**
 * Runs an ajax command.
 * @param {Object} parameters the objects to send (using JSON)
 * @param {Function} callback the function to call on completion. It is
 * 			given a single argument containing the reply text.
 * @param {String} [url="action"] the url to call
 * @param {String} [contentType="application/x-www-form-urlencoded"] the content type of this request
 * @param {Boolean} [asBinary=false] if true, send data as binary
 * @param {Function} [progress] a function to call when the upload makes progress. One argument
 * 			is given, a Number from 0 to 1 representing percentage complete.
 */
GenericStar.Editor.Library.prototype.ajax = function(parameters, callback, url, contentType, asBinary, progress) {
	if (url === undefined || url === null) url = "action";
	
	if (contentType === undefined || contentType === null) {
		contentType = "application/x-www-form-urlencoded";
	}
	if (asBinary === undefined || asBinary === null) asBinary = false;
	
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	} else {
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			callback(xmlhttp.responseText);
		}
	};
	
	if (progress !== undefined && progress !== null) {
		xmlhttp.upload.addEventListener("progress", progress, false);
	}
	
	xmlhttp.open("POST", "../../"+url, true);
	xmlhttp.setRequestHeader("content-type", contentType);
	if (!asBinary) {
		xmlhttp.send(JSON.stringify(parameters));
	} else {
		xmlhttp.sendAsBinary(parameters);
	}
};



/**
 * Creates an instance of the GS Editor Dom Helper.
 * @class Handles generic functions dealing with the HTML DOM.
 */
GenericStar.Editor.DomHelper = function() {};

GenericStar.Editor.DomHelper.prototype.addClass = function(dom, name) {
	var hasClass = new RegExp("(\\s|^)"+name+"(\\s|$)");
	if (!hasClass.test(dom.className)) {
		dom.className = dom.className + " " + name;
	}
};

GenericStar.Editor.DomHelper.prototype.remClass = function(dom, name) {
	var hasClass = new RegExp("(\\s|^)"+name+"(\\s|$)");
	if (hasClass.test(dom.className)) {
		dom.className = dom.className.replace(hasClass, " ").trim();
	}
};

GenericStar.Editor.DomHelper.prototype.remChildren = function(dom) {
	while(dom.hasChildNodes()) dom.removeChild(dom.firstChild);
};

/**
 * Adds a one-time use callback that will get called after the first animation
 * being executed on dom completes. The callback will not fire again.
 * @param {Node} dom the element that is transitioning
 * @param {Function} callback the function to be called after the first transition on dom completes
 */
GenericStar.Editor.DomHelper.prototype.addTransitionCallback = function(dom, callback) {
	var remAndCallback = function(e) {
		if (e.srcElement == dom) {
			dom.removeEventListener('webkitTransitionEnd', remAndCallback, false);
			callback();
		}
	};
	dom.addEventListener('webkitTransitionEnd', remAndCallback, false);
};

/**
 * Creates a new clickaway handler.
 * @class This class handles listening to clicks anywhere and executing
 * 		clickaway events for registered objects.
 */
GenericStar.Editor.ClickawayHandler = function() {
	var cwid = 0;
	
	var domReactions = new Array();
	
	var triggerClickaway = function(ignore) {
		for(var i=0; i < domReactions.length; i++) {
			if (domReactions[i].dom !== ignore) domReactions[i].action();
		}
	};
	
	window.onclick = function(e) {
		triggerClickaway(null);
	};
	
	this.addClickaway = function(dom, func, onclick) {
		if (dom.id === undefined || dom.id === null || dom.id === "") {
			dom.id = "clickawayAutoId"+cwid;
			cwid += 1;
		}
		domReactions.push({dom: dom, action: func});
		this.addException(dom, dom, onclick);
	};
	
	this.addException = function(domClick, domExcepted, onclick) {
		domClick.addEventListener("click", function(e) {
			e.stopPropagation();
			if (onclick !== undefined) onclick(e);
			triggerClickaway(domExcepted);
		}, false);
	};
	

	this.removeClickaway = function(dom) {
		for(var i = 0; i < domReactions.length; i++) {
			if (domReactions[i] === dom) {
				domReactions.splice(i, 1);
				i--;
			}
		}
	};
	
	this.simulateClickaway = function() {
		triggerClickaway(null);
	};
};

/**
 * Creates a Notification Controller.
 * 
 * @class Handles queueing and displaying notifications.
 * @param {Node} dom the DOM element that contains notifications
 */
GenericStar.Editor.NotificationController = function(dom) {
	var NOTIFICATION_TIME = 5000; //how long notifications stay up in milliseconds
	
	var domLib = new GenericStar.Editor.DomHelper();
	
	var notes = new Array();
	var locked = false;
	
	var domTitle = dom.getElementsByClassName("notifyTitle")[0];
	var domText  = dom.getElementsByClassName("notifyText")[0];
	var domIcon  = dom.getElementsByClassName("notifyIcon")[0];
	
	
	var processMessages = function() {
		if (locked) return;
		locked = true;
		var msg = notes.shift();
		domTitle.innerHTML = msg.title;
		domText.innerHTML = msg.message;
		if (msg.icon !== null && msg.icon !== undefined && msg.icon !== "") {
			domIcon.innerHTML = "<img src='img/"+msg.icon+"' />";
		} else {
			domIcon.innerHTML = "";
		}
		
		domLib.addClass(dom, "notifyVisible");
		setTimeout(function() {
			domLib.addTransitionCallback(dom, function() {
				locked = false;
				if (notes.length > 0) processMessages();
			});
			domLib.remClass(dom, "notifyVisible");
			
		}, NOTIFICATION_TIME);
	};
	
	this.queueNotification = function(icon, title, message) {
		notes.push({icon: icon, title: title, message: message});
		processMessages();
	};
};

/**
 * Creates a Drop Target object.
 * @class Handles a DOM drag-and-drop uploader.
 * @param {Node} domDrop the DOM element users drag files into.
 * @param {String} descType a string describing what type
 * 			of files can be uploaded by this uploader. Ex: "png, jpg, or gif".
 * @param {String} objectName the name of the directory the objects go in, ie: "images"
 * @param {RegExp} fileRestriction a regular expression filetypes must pass
 * 			to be allowed to be uploaded by this service.
 * @param {Node} domBubble the DOM element that will be minimized upon loading
 * @param {Node} domBtn the DOM element users click to upload all files
 * @param {Node} domThrobber the DOM element that replaces the button while loading
 * @param {GenericStar.Editor.NotificationController} notify used to notify user of errors
 * @param {GenericStar.Editor.GameLoader} loader the loader that controls whether or not this drop target can be used
 */
GenericStar.Editor.DropTarget = function(domDrop, descType, objectName, fileRestriction, domBubble, domBtn, domThrobber, notify, loader) {
	var files = new Object();
	
	var domLib = new GenericStar.Editor.DomHelper();
	
	var domThrobberData = domThrobber.getElementsByClassName("throbberData")[0];
	
	var cancel = function(e) {
		e.preventDefault();
		return false;
	};
	
	var createFileNode = function(file) {
		var node = document.createElement("div");
		node.className = "menuDroppedFile";
		
		var txt = document.createElement("div");
		txt.className = "menuDroppedFileText";
		txt.innerHTML = file.fileName;
		
		var btns= document.createElement("div");
		btns.className= "menuDroppedFileActions";
		btns.addEventListener("mouseover", function(e) {
			domLib.addClass(btns, "menuDroppedFileActionsOver");
		}, true);
		btns.addEventListener("mouseout", function(e) {
			domLib.remClass(btns, "menuDroppedFileActionsOver");
		}, true);
		
		var remBtn = document.createElement("div");
		remBtn.className = "button2";
		remBtn.innerHTML = "Remove";
		remBtn.addEventListener("click", function(e) {
			domLib.addTransitionCallback(node, function() {
				domDrop.removeChild(node);
				delete files[file.name];
			});
			domLib.addClass(node, "menuDroppedFileRemoved");
		}, true);
		
		btns.appendChild(remBtn);
		node.appendChild(txt);
		node.appendChild(btns);
		
		domDrop.appendChild(node);
		
		return node;
	};
	
	domDrop.addEventListener('dragover', cancel, true);
	domDrop.addEventListener('dragenter', cancel, true);
	domDrop.addEventListener('drop', function(e) {
		e.preventDefault();
		
		for(var i=0; i < e.dataTransfer.files.length; i++) {
			var file = e.dataTransfer.files[i];
			
			if (files.hasOwnProperty(file.fileName)) {
				notify.queueNotification("error.png", "Error", 
						"File Already Exists:<br/>"+file.fileName);
			} else if (!file.type.match(fileRestriction)) {
				notify.queueNotification("error.png", "Can't Add File", 
						file.fileName+"<br/>is not: "+descType);
				
			} else {
				var node = createFileNode(e.dataTransfer.files[i]);
				files[file.fileName] = {
					file: file,
					node: node
				};
			}
		}
		
		return false;
	}, true);
	
	domBtn.addEventListener('click', function(e) {
		if (!loader.isGameLoaded()) return;
		
		var fileArr = new Array();
	    for(var prop in files) {
		    if(files.hasOwnProperty(prop)) {
		    	fileArr.push(files[prop].file);
		    }
	    }
	    
	    if (fileArr.length <= 0) return;
		
		
		var boundary = '--multipartformboundary' + (new Date).getTime();
	    var dashdash = '--';
	    var crlf     = '\r\n';
	    
		var send = function(bindata, addedFileCnt) {
			if (addedFileCnt <= 0) return;
			bindata += dashdash;
		    
			var ct = "multipart/form-data; boundary="+ boundary;
			
			domLib.addClass(domThrobber, "throbberVisible");
			domLib.addClass(domBtn,    "throbberInvisible");
			
			var worker = new Worker('editorUploadThread.js');
			worker.postMessage({
						bindata: bindata,
						ct: ct, 
						url: "upload/games/"+loader.getCurrentGame()+"/"+objectName
					});
			worker.addEventListener('message', function(e) {
				//domThrobberData.innerHTML = Math.round(e.data.progress*100)+"%";
				
				if (e.data.response !== null) {
					if (e.data.response === "ok") {
						var objCap = objectName.charAt(0).toUpperCase() + objectName.slice(1);
						notify.queueNotification("newgame.png", objCap+" Added", 
								"The "+objectName+" were successfully<br/>added to the game.");
					}
					
					domLib.remClass(domThrobber, "throbberVisible");
					domLib.remClass(domBtn,    "throbberInvisible");
					while(domDrop.hasChildNodes()) domDrop.removeChild(domDrop.firstChild);
					files = new Object();
					loader.loadGame([objectName]);
					domLib.remClass(domBubble, "menuAddFileVisible");
					worker.terminate();
				}
				
			}, false);
		};
		
		var addFile = function(fileArr, bindata, addedFileCnt) {
			var file = fileArr.shift();
			
			if (!file.type.match(fileRestriction)) {
				
				notify.queueNotification("error.png", "Error", 
						file.fileName+"<br/>is not: "+descType);
				
				if (fileArr.length > 0) addFile(fileArr, bindata, addedFileCnt);
		        else send(bindata, addedFileCnt);
				
			} else {
				addedFileCnt += 1;
				bindata += 'Content-Disposition: form-data; name="user_file[]"';
		        if (file.fileName) {
		        	bindata += '; filename="' + file.fileName + '"';
		        }
		        bindata += crlf;
		        bindata += 'Content-Type: application/octet-stream';
		        bindata += crlf;
		        bindata += crlf;
		        
		        var reader = new FileReader();
		        reader.readAsBinaryString(file);
		        reader.onload = function(e) {
		        	bindata += reader.result;
			        bindata += crlf;
			        
			        bindata += dashdash;
			        bindata += boundary;
			        if (fileArr.length > 0) bindata += crlf;
			        
			        if (fileArr.length > 0) addFile(fileArr, bindata, addedFileCnt);
			        else send(bindata, addedFileCnt);
		        };
			}
		};
	    
	    var bindata = '';
	    bindata += dashdash;
	    bindata += boundary;
	    bindata += crlf;
	    addFile(fileArr, bindata, 0);
	}, true);
};

/**
 * @class This class handles the load button, as well as 
 *			actually loading resources in when it needs to.
 * @param {Node} domBtn the DOM of the select list that will contain the games
 * @param {GenericStar.Editor.Sidebar} sidebar a sidebar object to communicate with (load things into)
 */
GenericStar.Editor.GameLoader = function(domBtn, sidebar) {
	var gamesLoaded = false;
	var glFirst=true;
	var glCall = new Array();
	var self = this;
	var lib = new GenericStar.Editor.Library();
	
	var setGamesLoaded = function(val) {
		var oldVal = gamesLoaded;
		gamesLoaded = val;
		if (glFirst || oldVal !== gamesLoaded) {
			for(var i=0; i < glCall.length; i++) glCall[i](gamesLoaded);
			glFirst = false;
		}
	};
	
	domBtn.addEventListener('change', function(e) {
		if (gamesLoaded) {
			var newGame = domBtn.options[domBtn.selectedIndex].text;
			lib.ajax({cmd: "select", selected: newGame}, function(){
				self.loadGame();
			});
		}
	}, true);
	
	/**
	 * Refreshes a given segment of game data.
	 * @param {Array} loadSegment an array of strings that tell this method
	 * 		which segment of data to load. Ex: ["images", "sounds"].
	 * 		Optional: if not given, all segments will be loaded.
	 */
	this.loadGame = function(loadSegment) {
		var allTypes = ["images", "sounds", "code", "rooms"];
		
		var makeCallback = function(reloadType) {
			return function(txt) {
				if (sidebar === null) return;
				var ret = JSON.parse(txt);
				if (reloadType === null) {
					for(var i=0; i<allTypes.length; i+=1) {
						sidebar.replaceSidebarContent(allTypes[i], ret[allTypes[i]]);
					}
				} else {
					sidebar.replaceSidebarContent(reloadType, ret[reloadType]);
				}
				
				if (reloadType === "code" || reloadType === null) {
					sidebar.replaceSidebarObjects(ret.codeParams);
				}
				
				if (reloadType === "rooms" || reloadType === null) {
					sidebar.replaceSidebarRooms(ret.roomParams);
				}
			};
		};
		
		var g = self.getCurrentGame();
		if (loadSegment === undefined || loadSegment === null) {
			lib.ajax({cmd: "ls",  game: g}, makeCallback(null));
		} else {
			for(var i=0; i<loadSegment.length; i+=1) {
				if (!lib.inArr(allTypes, loadSegment[i])) continue;
				lib.ajax({cmd: "ls",  game: g, type: loadSegment[i]}, makeCallback(loadSegment[i]));
			}
		}
	};
	
	this.updateLoadBtn = function() {
		lib.ajax({cmd: "ls"}, function(txt) {
			var ret = JSON.parse(txt);
			var previousSelected = "";
			if (gamesLoaded) {
				previousSelected = domBtn.options[domBtn.selectedIndex].text;
			}
			while(domBtn.options.length > 0) domBtn.remove(0);
			
			if (ret.games.length < 1) {
				var option=document.createElement("option");
				option.text="No Games";
				option.value = "No Games";
				domBtn.add(option,null);
				setGamesLoaded(false);
			} else {
				for(var i=0; i < ret.games.length; i++) {
					var option=document.createElement("option");
					option.text  = ret.games[i];
					option.value = ret.games[i];
					option.selected = ret.games[i] === ret.selected;
					domBtn.add(option,null);
				}
				setGamesLoaded(true);
				if (domBtn.options[domBtn.selectedIndex].text !== previousSelected) {
					self.loadGame();
				}
			}
		});
	};
	
	this.addGameLoadedCallback = function(f) {
		glCall.push(f);
	};
	
	this.isGameLoaded = function() {
		return gamesLoaded;
	};
	
	this.getCurrentGame = function() {
		return domBtn.options[domBtn.selectedIndex].text;
	};
	
	this.setSidebar = function(s) {
		sidebar = s;
	};
};

/**
 * Creates a new Modal Dialog handler.
 * @class This class handles all modal dialog boxes and the screen that prevents other dialogs.
 * @param {Node} domScreen the DOM of the screen that shades the rest of the screen
 * @param {GenericStar.Editor.GameLoader} loader the game loader used to discover which game is selected
 * @param {GenericStar.Editor.Sidebar} sidebar the sidebar that this modal system is linked to (optional)
 */
GenericStar.Editor.ModalDialogs = function(domScreen, loader, sidebar) {
	var domLib = new GenericStar.Editor.DomHelper();
	var lib = new GenericStar.Editor.Library();
	
	//button modal dom variables
	var domBtn = domScreen.getElementsByClassName("modalBtnsDialog")[0];
	var domBtnTitle = domBtn.getElementsByClassName("modalBtnsDialogTitle")[0];
	var domBtnText  = domBtn.getElementsByClassName("modalBtnsDialogText")[0];
	var domBtnBtns  = domBtn.getElementsByClassName("modalBtnsButtonRow")[0];
	
	//image modal dom variables
	var domImage = domScreen.getElementsByClassName("modalImageDialog")[0];
	var domImageChecks =    domImage.getElementsByClassName("modalImageCheck");
	var domImageAnimation = domImage.getElementsByClassName("modalImageAnimationSettings")[0];
	var domImageInputs =    domImage.getElementsByClassName("modalImageAnimationInput");
	var domImageListPanel = domImage.getElementsByClassName("modalImageListingPanel")[0];
	var domImagePicture =   domImage.getElementsByClassName("modalImagePicture")[0];
	var domImageCancel =    domImage.getElementsByClassName("modalFileButtonCancel")[0];
	var domImageSave =      domImage.getElementsByClassName("modalFileButtonSave")[0];
	var domImageList = null;
	var domImagePictureImg = document.createElement("img");
	domImagePictureImg.className = "modalImagePictureImg";
	domImagePicture.appendChild(domImagePictureImg);
	var imageSelectedUrl = "";
	
	//sound modal dom variables
	var domSound = domScreen.getElementsByClassName("modalSoundDialog")[0];
	var domSoundListPanel = domSound.getElementsByClassName("modalSoundListingPanel")[0];
	var domSoundCancel =    domSound.getElementsByClassName("modalFileButtonCancel")[0];
	var domSoundSave =      domSound.getElementsByClassName("modalFileButtonSave")[0];
	var domSoundList = null;
	var soundSelectedUrl = "";
	
	//common modal functions
	var selectRow = function(domList, sel, url) {
		if (domList === null) return;
		for(var i=0; i<domList.childNodes.length; i++) {
			if (sel === i) domLib.addClass(domList.childNodes[i], "modalFileListingItemSelected");
			else domLib.remClass(domList.childNodes[i], "modalFileListingItemSelected");
			if (url !== undefined) {
				var domTemp = domList.childNodes[i].getElementsByClassName("modalFileListingItemText")[0];
				if (domTemp.innerHTML === url) {
					domLib.addClass(domList.childNodes[i], "modalFileListingItemSelected");
				}
			}
		}
	};
	
	var makeRow = function(type, url, i, end, callback) {
		var row = document.createElement("div");
		row.className = "modalFileListingItem";
		if (end) row.className += " modalFileListingItemEnd";
		
		var thumbMaker = (type === "images") ? lib.createImageThumb : lib.createSoundThumb;
		var thumb = thumbMaker("../../games/"+loader.getCurrentGame()+"/"+type+"/"+url, domLib);
		thumb.addEventListener("click", function(e) {
			e.stopPropagation();
		}, false);
		domLib.addClass(thumb, "modalFileListingItemThumb");
		
		var text = document.createElement("div");
		text.className = "modalFileListingItemText";
		text.innerHTML = url;
		
		row.addEventListener("click", function(e) {
			callback(url, i);
		}, false);
		
		row.appendChild(thumb);
		row.appendChild(text);
		
		return row;
	};
	
	//image specific setup
	for(var i=0; i<domImageInputs.length; i+=1) {
		domImageInputs[i].disabled = true;
	}
	
	var imageAnimationCheckChanged = function(e) {
		var checked = !!domImageChecks[1].checked;
		for(var i=0; i<domImageInputs.length; i+=1) {
			domImageInputs[i].disabled = !checked;
		}
		if (checked) domLib.addClass(domImageAnimation, "modalImageAnimationSettingsEnabled");
		else domLib.remClass(domImageAnimation, "modalImageAnimationSettingsEnabled");
	};
	
	domImageChecks[1].addEventListener("change", imageAnimationCheckChanged, false);
	
	var updateImageList = function() {
		var imgs = sidebar.getImageList();
		
		domImageList = document.createElement("div");
		domImageList.className = "modalFileListing";
		
		for(var i=0; i<imgs.length; i+=1) {
			var lastImg = i === imgs.length-1;
			var domRow = makeRow("images", imgs[i], i, lastImg, function(callUrl, callNum) {
				selectRow(domImageList, callNum);
				domImagePictureImg.src = "../../games/"+loader.getCurrentGame()+"/images/"+callUrl;
				domLib.remClass(domImagePictureImg, "modalImagePictureImgHidden");
				imageSelectedUrl = callUrl;
			});
			domImageList.appendChild(domRow);
		};
		
		domLib.remChildren(domImageListPanel);
		domImageListPanel.appendChild(domImageList);
		imageSelectedUrl = "";
	};
	
	domImageCancel.addEventListener("click", function(e) {
		domLib.remClass(domScreen, "modalScreenUp");
	}, false);
	
	//sound specific setup
	var updateSoundList = function() {
		var sounds = sidebar.getSoundList();
		
		domSoundList = document.createElement("div");
		domSoundList.className = "modalFileListing";
		
		for(var i=0; i<sounds.length; i+=1) {
			var lastSound = i === sounds.length-1;
			var domRow = makeRow("sounds", sounds[i], i, lastSound, function(callUrl, callNum) {
				selectRow(domSoundList, callNum);
				soundSelectedUrl = callUrl;
			});
			domSoundList.appendChild(domRow);
		};
		
		domLib.remChildren(domSoundListPanel);
		domSoundListPanel.appendChild(domSoundList);
		soundSelectedUrl = "";
	};
	
	domSoundCancel.addEventListener("click", function(e) {
		domLib.remClass(domScreen, "modalScreenUp");
	}, false);
	
	//common modal setup
	var domModalDialogs = [domBtn, domImage, domSound];
	
	domScreen.addEventListener("click", function(e) {
		domLib.remClass(domScreen, "modalScreenUp");
	}, false);
	
	for(var i=0; i<domModalDialogs.length; i+=1) {
		domModalDialogs[i].addEventListener("click", function(e) {
			e.stopPropagation();
		}, false);
	}
	
	var hideDialogs = function() {
		for(var i=0; i<domModalDialogs.length; i+=1) {
			domLib.remClass(domModalDialogs[i], "modalDialogVisible");
		}
	};
	
	/**
	 * Brings up a modal dialog button box.
	 * @param {String} title the title that the dialog will have
	 * @param {String} text the text that is displayed under the title
	 * @param {Array} btnArr an array of strings with each button name
	 * @param {Function} callback a function that will be called back with the index number
	 * 		of the chosen item. Note that calling this function does not guarantee the callback
	 * 		is called back, the user may cancel the request.
	 */
	this.showButtonDialog = function(title, text, btnArr, callback) {
		domBtnTitle.innerHTML = title;
		domBtnText.innerHTML = text;
		
		domLib.remChildren(domBtnBtns);
		var addBtn = function(btnTxt, index) {
			var btns = document.createElement("div");
			btns.className = "button2 modalBtnsButton";
			btns.innerHTML = btnTxt;
			btns.addEventListener("click", function(e) {
				domLib.remClass(domScreen, "modalScreenUp");
				callback(index);
			}, true);
			domBtnBtns.appendChild(btns);
		};
		for(var i=0; i<btnArr.length; i++) {
			addBtn(btnArr[i], i);
		}
		
		hideDialogs();
		domLib.addClass(domBtn, "modalDialogVisible");
		domLib.addClass(domScreen, "modalScreenUp");
	};
	
	/**
	 * Brings up an image selection dialog.
	 * @param {Object} defaults the defaults to set this dialog to (url, worldAlign, animated,
	 * 			frameCol, frameRow, startFrame, endFrame).
	 * @param {Function} callback a function that will be called back upon clicking
	 * 		the "save" button. Note calling showImageDialog does not guarantee that
	 * 		callback will be called. callback takes 1 argument, which is an object
	 * 		describing the settings set by the dialog.
	 */
	this.showImageDialog = function(defaults, callback) {
		hideDialogs();
		
		if (defaults === undefined || defaults === null) defaults = {};
		
		//set to defaults
		domImageChecks[0].checked = defaults.worldAlign ? defaults.worldAlign : false;
		domImageChecks[1].checked = defaults.animated   ? defaults.animated   : false;
		domImageInputs[0].value   = defaults.frameCol   ? defaults.frameCol   : 1;
		domImageInputs[1].value   = defaults.frameRow   ? defaults.frameRow   : 1;
		domImageInputs[2].value   = defaults.startFrame ? defaults.startFrame : 1;
		domImageInputs[3].value   = defaults.endFrame   ? defaults.endFrame   : 1;
		imageAnimationCheckChanged(null);
		selectRow(domImageList, -1, defaults.url);
		if (defaults.url !== undefined) {
			domImagePictureImg.src = "../../games/"+loader.getCurrentGame()+"/images/"+defaults.url;
			domLib.remClass(domImagePictureImg, "modalImagePictureImgHidden");
			imageSelectedUrl = defaults.url;
		} else {
			domLib.addClass(domImagePictureImg, "modalImagePictureImgHidden");
			imageSelectedUrl = "";
		}
		
		//show and setup callback
		domLib.addClass(domImage,  "modalDialogVisible");
		domLib.addClass(domScreen, "modalScreenUp");
		
		domImageSave.onclick = function(e) {
			domLib.remClass(domScreen, "modalScreenUp");
			callback({
				url: imageSelectedUrl,
				worldAlign: !!domImageChecks[0].checked,
				animated:   !!domImageChecks[1].checked,
				frameCol:   parseInt(domImageInputs[0].value),
				frameRow:   parseInt(domImageInputs[1].value),
				startFrame: parseInt(domImageInputs[2].value),
				endFrame:   parseInt(domImageInputs[3].value)
			});
		};
	};
	
	/**
	 * Brings up a sound selection dialog.
	 * @param {Object} defaults the defaults to set this dialog to (contains url property).
	 * @param {Function} callback a function that will be called back upon clicking
	 * 		the "save" button. Note calling showSoundDialog does not guarantee that
	 * 		callback will be called. callback takes 1 argument, which is an object
	 * 		describing the settings set by the dialog.
	 */
	this.showSoundDialog = function(defaults, callback) {
		hideDialogs();
		
		if (defaults === undefined || defaults === null) defaults = {};
		
		//set to defaults
		selectRow(domSoundList, -1, defaults.url);
		soundSelectedUrl = (defaults.url) ? defaults.url : "";
		
		//show and setup callback
		domLib.addClass(domSound,  "modalDialogVisible");
		domLib.addClass(domScreen, "modalScreenUp");
		
		domSoundSave.onclick = function(e) {
			domLib.remClass(domScreen, "modalScreenUp");
			callback({url: soundSelectedUrl});
		};
	};
	
	/**
	 * Sets the sidebar of this modal system. Only does anything if this
	 * modal system does not yet have a set sidebar.
	 * @param {GenericStar.Editor.Sidebar} s the sidebar to set this to
	 */
	this.setSidebar = function(s) {
		if (sidebar !== undefined && sidebar !== null) return;
		sidebar = s;
		sidebar.addImageListChangedEvent(function(e) {
			updateImageList();
		});
		sidebar.addSoundListChangedEvent(function(e) {
			updateSoundList();
		});
		updateImageList();
		updateSoundList();
	};
	
	if (sidebar !== undefined && sidebar !== null) this.setSidebar(sidebar);
};

/**
 * Creates a sidebar object.
 * @class This method handles user interaction with the sidebar. This includes
 * 		adding / editing files and objects.
 * @param {Node} domMain the DOM node representing the root of the sidebar
 * @param {GenericStar.Editor.NotificationController} notify the notification controller to send notificaitons to
 * @param {GenericStar.Editor.GameLoader} loader the loader responsible for loading games
 * @param {GenericStar.Editor.ClickawayHandler} clickaway the clickaway handler handling this page
 * @param {GenericStar.Editor.ModalDialogs} modal the modal dialog handler
 */
GenericStar.Editor.Sidebar = function(domMain, notify, loader, clickaway, modal) {
	var domNg = domMain.getElementsByClassName("sidebarNoGames")[0];
	var domEditor = domMain.getElementsByClassName("sidebarEditor")[0];
	var firstMPSet = true;
	var lib = new GenericStar.Editor.Library();
	var domLib = new GenericStar.Editor.DomHelper();
	var generics = new GenericStar.Editor.Generics.GenericManifest();
	var DataChangeEvent = GenericStar.Editor.Sidebar.DataChangeEvent;
	
	var editor = null;
	
	var urlEvents = {
		images: new Array(),
		sounds: new Array()
	};
	var urls = {};
	
	var urlChangedEvent = function(type, event) {
		if (urlEvents[type] === undefined) return;
		for(var i=0; i<urlEvents[type].length; i+=1) {
			urlEvents[type][i](event);
		}
	};
	
	//setup content boxes
	var contentBoxes = new Object();
	contentBoxes.images = domMain.getElementsByClassName("sidebarImages")[0];
	contentBoxes.sounds = domMain.getElementsByClassName("sidebarSounds")[0];
	contentBoxes.code = domMain.getElementsByClassName("sidebarCode")[0];
	contentBoxes.rooms = domMain.getElementsByClassName("sidebarRooms")[0];
	var contentListing = new Object();
	
	//setup "add _ [+]" buttons
	var addBtns = domEditor.getElementsByClassName("sidebarTitleLine");
	var setupAnimation = function(btn) {
		var toAnimate = btn.getElementsByClassName("sidebarTitleAdd")[0];
		
		btn.addEventListener('mouseover', function(e) {
			if (loader.isGameLoaded()) domLib.addClass(toAnimate, "sidebarTitleAddVisible");
		}, true);
		
		btn.addEventListener('mouseout', function(e) {
			domLib.remClass(toAnimate, "sidebarTitleAddVisible");
		}, true);
	};
	for(var i=0; i<addBtns.length; i++) setupAnimation(addBtns[i]);
	
	//setup image box
	var menuAddImg = document.getElementById("menuAddImg");
	var domAddImgBtn  = menuAddImg.getElementsByClassName("button2")[0];
	var domAddImgBox  = menuAddImg.getElementsByClassName("menuDropbox")[0];
	var domAddImgThrob= menuAddImg.getElementsByClassName("throbber")[0];
	var dt1 = new GenericStar.Editor.DropTarget(domAddImgBox, 
			"png, jpg, or gif", "images", /^image\/(gif|jpeg|png)$/, 
			menuAddImg, domAddImgBtn, domAddImgThrob, notify, loader);
	
	clickaway.addException(addBtns[0], menuAddImg, function(e) {
		if (loader.isGameLoaded()) domLib.addClass(menuAddImg, "menuAddFileVisible");
	});
	clickaway.addClickaway(menuAddImg, function() {
		domLib.remClass(menuAddImg, "menuAddFileVisible");
	});
	
	//setup sound box
	var menuAddSnd = document.getElementById("menuAddSnd");
	var domAddSndBtn  = menuAddSnd.getElementsByClassName("button2")[0];
	var domAddSndBox  = menuAddSnd.getElementsByClassName("menuDropbox")[0];
	var domAddSndThrob= menuAddSnd.getElementsByClassName("throbber")[0];
	var dt1 = new GenericStar.Editor.DropTarget(domAddSndBox,
			"mp3, wav, or ogg", "sounds", /^audio\/(mp3|wav|ogg)$/,
			menuAddSnd, domAddSndBtn, domAddSndThrob, notify, loader);
	
	clickaway.addException(addBtns[1], menuAddSnd, function(e) {
		if (loader.isGameLoaded()) domLib.addClass(menuAddSnd, "menuAddFileVisible");
	});
	clickaway.addClickaway(menuAddSnd, function() {
		domLib.remClass(menuAddSnd, "menuAddFileVisible");
	});
	
	//setup code box
	var domAddCode = document.getElementById("menuAddCode");
	var domEditCode =document.getElementById("menuEditCode");
	var domCodeGenericSelect= domAddCode.getElementsByClassName("menuGenericSelector")[0];
	var domCodeSettings     = domAddCode.getElementsByClassName("genericOpts")[0];
	var domCodeName         = domAddCode.getElementsByClassName("menuAddCodeName")[0];
	var domCodeAdd          = domAddCode.getElementsByClassName("button2")[0];
	var domCodeEditList     = domEditCode.getElementsByClassName("genericOpts")[0];
	var codeEditing = false;
	var editWho = "";
	var classes = new Object();
	var selectedCode = null;
	var selectedCodeDom = null;
	var setSelectedCode = function(code, dom) {
		if (selectedCodeDom !== null) domLib.remClass(selectedCodeDom, "sidebarRowSelected");
		selectedCodeDom = dom;
		selectedCode = code;
		if (selectedCodeDom !== null) domLib.addClass(selectedCodeDom, "sidebarRowSelected");
	};
	
	//setup room box
	var domAddRooms = document.getElementById("menuAddRoom");
	var domARoomInputs = domAddRooms.getElementsByClassName("menuRoomInput");
	var domARoomBtn = domAddRooms.getElementsByClassName("button2")[0];
	var domEditRooms = document.getElementById("menuEditRoom");
	var domERoomInputs = domEditRooms.getElementsByClassName("menuRoomInput");
	var domERoomBtn = domEditRooms.getElementsByClassName("button2")[0];
	var roomChangeActions = new Array();
	var rooms = {};
	var defaultRoom = {name: "", width: 640, height: 480, vwidth: 640, vheight: 480};
	var editRoomWho = "";
	var roomEditing = false;
	var selectedRoom = null;
	var selectedRoomDom = null;
	var triggerRoomRefresh = function() {
		for(var i=0; i<roomChangeActions.length; i++) {
			roomChangeActions[i]();
		}
	};
	
	var setSelectedRoom = function(code, dom) {
		if (selectedRoomDom !== null) domLib.remClass(selectedRoomDom, "sidebarRowSelected");
		selectedRoomDom = dom;
		selectedRoom = code;
		if (selectedRoomDom !== null) domLib.addClass(selectedRoomDom, "sidebarRowSelected");
		triggerRoomRefresh();
	};
	var setRoomInputs = function(roomObj, inputs) {
		inputs[0].value = roomObj.name;
		inputs[1].value = roomObj.width;
		inputs[2].value = roomObj.height;
		inputs[3].value = roomObj.vwidth;
		inputs[4].value = roomObj.vheight;
	};
	setRoomInputs(defaultRoom, domARoomInputs);
	
	domARoomInputs[0].addEventListener("keyup", function(e) {
		var filtered = lib.programmingFilter(domARoomInputs[0], false);
		if (filtered !== domARoomInputs[0].value) domARoomInputs[0].value = filtered;
	}, false);
	clickaway.addException(addBtns[3], domAddRooms, function(e) {
		if (loader.isGameLoaded()) domLib.addClass(domAddRooms, "menuAddFileVisible");
	});
	
	//Create Content Box - Creates a row in the sidebar
	var createContentBox = function(type, game, url, domParent) {
		var dotInd = url.lastIndexOf(".");
		var fileName = url.slice(0, dotInd);
		var fileType = url.slice(dotInd);
		var editing = false;
		
		var node = document.createElement("div");
		node.className = "sidebarRow";
		
		var btn = document.createElement("div");
		btn.className = "button2 sidebarButton";
		btn.innerHTML = "Delete";
		
		var text = document.createElement("div");
		text.className = "sidebarRowText";
		text.innerHTML = (type === "code" || type === "rooms") ?
				url.slice(0, url.lastIndexOf(".")) : url;
		
		var textEdit= document.createElement("input");
		textEdit.type = "text";
		textEdit.className = "sidebarRowRename";
		textEdit.maxLength = 100;
		textEdit.value = fileName;
		
		var addHoverEvent = function(type, dom, domFx, func, className) {
			dom.addEventListener(type, function(e) {
				if (!editing) func(domFx, className);
			}, false);
		};
		
		//filename editor
		if (type !== "code" && type !== "rooms") {
			var clickawayFunction = function() {
				if (textEdit.value !== fileName) {
					var newName = lib.filenameFilter(textEdit, true);
					var args = {cmd: "rn", game: game, type: type, fnFrom: fileName+fileType, fnTo: newName+fileType};
					lib.ajax(args, function(e) {
						var ret = JSON.parse(e);
						if (lib.inArr(ret.err, 404)) {
							notify.queueNotification("error.png", "Error", "File out of sync.<br/>Please reload this page.");
							textEdit.value = fileName;
							
						} else if (lib.inArr(ret.err, 409)) {
							notify.queueNotification("error.png", "Error", "A file already exists named<br/>"+newName+fileType+".");
							textEdit.value = fileName;
							
						} else {
							delete urls[type][fileName+fileType];
							urls[type][newName+fileType] = true;
							urlChangedEvent(type, new DataChangeEvent(DataChangeEvent.RENAME, 
									fileName+fileType, newName+fileType));
							
							fileName = newName;
							text.innerHTML = fileName+fileType;
							textEdit.value = fileName;
						}
					});
				}
				domLib.remClass(textEdit, "sidebarRowRenameVisible");
				domLib.remClass(text, "sidebarRowTextHidden");
				editing = false;
			};
			
			clickaway.addClickaway(textEdit, clickawayFunction);
			clickaway.addException(text, textEdit, function(e) {
				textEdit.value = fileName;
				domLib.addClass(textEdit, "sidebarRowRenameVisible");
				domLib.addClass(text, "sidebarRowTextHidden");
				textEdit.focus();
				textEdit.select();
				editing = true;
				domLib.remClass(btn, "sidebarButtonOverRow");
				domLib.remClass(btn, "sidebarButtonOver");
			});
			
			textEdit.addEventListener('keyup', function(e) {
				var inputVal = textEdit.value;
				var newInput = lib.filenameFilter(textEdit, false);
				if (inputVal !== newInput) textEdit.value = newInput;
				
				if (e.keyCode == 13) clickawayFunction();
			}, true);
			
		//code stuff: selecting by clicking
		} else {
			text.addEventListener("click", function(e) {
				if (type === "code") setSelectedCode(fileName, node);
				if (type === "rooms")setSelectedRoom(fileName, node);
				
			}, false);
		}
		
		//delete button
		btn.addEventListener("click", function(e) {
			var del = function(ind) {
				if (ind === 0) {
					var args = {cmd: "rm", game: game, type: type, fn: fileName+fileType};
					lib.ajax(args, function(e) {
						var ret = JSON.parse(e);
						if (lib.inArr(ret.err, 404)) {
							notify.queueNotification("error.png", "Error", "File out of sync.<br/>Please reload this page.");
						} else {
							domLib.addTransitionCallback(node, function() {
								clickaway.removeClickaway(textEdit);
								domParent.removeChild(node);
							});
							domLib.addClass(node, "sidebarRowCollapse");
							delete urls[type][fileName+fileType];
							urlChangedEvent(type, new DataChangeEvent(DataChangeEvent.DELETE, fileName+fileType, null));
							if (type === "code") setSelectedCode(null, null);
							if (type === "rooms") setSelectedRoom(null, null);
						}
					});
				}
			};
			modal.showButtonDialog("Delete", 
					"Do you really want to delete:<br/> &nbsp; "+fileName+"<br/><br/>This cannot be undone.", 
					["Delete", "Cancel"], del);
		}, false);
		
		
		//type specific ui (thumbnails, etc)
		if (type === "images") {
			var thumb = lib.createImageThumb("../../games/"+loader.getCurrentGame()+"/images/"+url);
			node.appendChild(thumb);
		}
		
		if (type === "sounds") {
			var thumb = lib.createSoundThumb("../../games/"+loader.getCurrentGame()+"/sounds/"+url, domLib);
			node.appendChild(thumb);
		}
		
		if (type === "code") {
			var className = url.slice(0, url.lastIndexOf("."));
			var btn2 = document.createElement("div");
			btn2.className = "button2 sidebarButton sidebarButton2";
			btn2.innerHTML = "Edit";
			
			addHoverEvent("mouseover", node, btn2, domLib.addClass, "sidebarButtonOverRow");
			addHoverEvent("mouseout",  node, btn2, domLib.remClass, "sidebarButtonOverRow");
			addHoverEvent("mouseover", btn2, btn2, domLib.addClass, "sidebarButtonOver");
			addHoverEvent("mouseout",  btn2, btn2, domLib.remClass, "sidebarButtonOver");
			
			node.appendChild(btn2);
			btn2.addEventListener("click", function(e) {
				domLib.remClass(domAddCode, "menuAddFileVisible");
				if (codeEditing) {
					clickaway.simulateClickaway();
				} else {
					domLib.remChildren(domCodeEditList);
					domCodeEditList.appendChild(classes[className].makeSettingPanel(modal));
					if (loader.isGameLoaded()) domLib.addClass(domEditCode, "menuAddFileVisible");
					codeEditing = true;
					editWho = className;
					e.stopPropagation();
				}
				
			}, false);
		}
		
		if (type === "rooms") {
			var className = url.slice(0, url.lastIndexOf("."));
			var btn2 = document.createElement("div");
			btn2.className = "button2 sidebarButton sidebarButton2";
			btn2.innerHTML = "Edit";
			
			addHoverEvent("mouseover", node, btn2, domLib.addClass, "sidebarButtonOverRow");
			addHoverEvent("mouseout",  node, btn2, domLib.remClass, "sidebarButtonOverRow");
			addHoverEvent("mouseover", btn2, btn2, domLib.addClass, "sidebarButtonOver");
			addHoverEvent("mouseout",  btn2, btn2, domLib.remClass, "sidebarButtonOver");
			
			node.appendChild(btn2);
			btn2.addEventListener("click", function(e) {
				domLib.remClass(domAddRooms, "menuAddFileVisible");
				if (roomEditing) {
					clickaway.simulateClickaway();
				} else {
					roomEditing = true;
					editRoomWho = className;
					setRoomInputs(rooms[className], domERoomInputs);
					domLib.addClass(domEditRooms, "menuAddFileVisible");
					e.stopPropagation();
				}
			}, false);
		}
		
		node.appendChild(text);
		node.appendChild(textEdit);
		node.appendChild(btn);
		
		
		addHoverEvent("mouseover", node, btn, domLib.addClass, "sidebarButtonOverRow");
		addHoverEvent("mouseout",  node, btn, domLib.remClass, "sidebarButtonOverRow");
		addHoverEvent("mouseover", btn,  btn, domLib.addClass, "sidebarButtonOver");
		addHoverEvent("mouseout",  btn,  btn, domLib.remClass, "sidebarButtonOver");
		
		return node;
		
	}; //End of createContentBox

	
	
	//handle code effects
	var genericList = generics.getInstanceList();
	domLib.remChildren(domCodeGenericSelect);
	for(var i=0; i < genericList.length; i++) {
		var opt = document.createElement("option");
		opt.text = genericList[i];
		opt.value = i;
		if (i == 0) opt.selected = true;
		domCodeGenericSelect.add(opt, null);
	}
	
	var saveObject = function(filename, obj, isNew) {
		var params = obj.getParams();
		params.__type = obj.__type;
		var settings = JSON.stringify(params);
		lib.ajax({cmd: "mkCode", name: filename, type: obj.__type, settings: settings}, function(e) {
			var ret = JSON.parse(e);
			if (lib.inArr(ret.err, 500)) {
				notify.queueNotification("error.png", "Error", "Could Not Make Code, Server Error<br/>Try restarting Generic Star.");
			} else {
				if (isNew) {
					notify.queueNotification("newgame.png", "Code Added","Created Object File:<br/> &nbsp; "+filename);
					var node = createContentBox("code", loader.getCurrentGame(), filename+".js", contentListing.code);
					contentListing.code.appendChild(node);
				} else {
					if (editor) editor.repaint();
				}
				classes[filename] = obj;
			}
			
			domLib.remClass(domAddCode, "menuAddFileVisible");
		});
	};
	
	//upon resource change, update code
	var updateAll = function(type, e) {
		for(var className in classes) {
			var changed = classes[className].updatePointers(type, e);
			if (changed) saveObject(className, classes[className], false);
		}
	};
	urlEvents.images.push(function(e) {
		updateAll("sprite", e);
	});
	urlEvents.sounds.push(function(e) {
		updateAll("sound", e);
	});
	
	//upon changing selected generic, change menu
	var selectChange = function(e) {
		var dom = generics.getStaticInstance(genericList[domCodeGenericSelect.selectedIndex]).makeSettingPanel(modal);
		domLib.remChildren(domCodeSettings);
		domCodeSettings.appendChild(dom);
	};
	domCodeGenericSelect.addEventListener("change", selectChange, false);
	selectChange(null);
	
	domCodeName.addEventListener("keyup", function(e) {
		var newVal = lib.programmingFilter(domCodeName, false);
		if (newVal !== domCodeName.value) domCodeName.value = newVal;
	}, false);
	
	//create a new object via generic copying
	domCodeAdd.addEventListener("click", function(e) {
		var error = null;
		if (lib.isKeyword(domCodeName.value)) error = "You cannot use that word.";
		var name = lib.programmingFilter(domCodeName, true);
		if (name.length <= 0 && error === null) error = "You must specify a name<br/>for your object!";
		for (var className in classes) {
			if (name.toLowerCase() === className.toLowerCase() && error === null)
				error = "That name is taken:<br/> &nbsp; "+className;
		}
		if (error !== null) {
			notify.queueNotification("error.png", "Error", error);
			return;
		} else {
			var type = genericList[domCodeGenericSelect.selectedIndex];
			var objToCreate = generics.getStaticInstance(type).generate();
			saveObject(name, objToCreate, true);
		}
		
	}, false);
	
	clickaway.addException(addBtns[2], domAddCode, function(e) {
		if (loader.isGameLoaded()) domLib.addClass(domAddCode, "menuAddFileVisible");
		domCodeName.value = "";
	});
	clickaway.addClickaway(domAddCode, function() {
		domLib.remClass(domAddCode, "menuAddFileVisible");
	});
	clickaway.addClickaway(domEditCode, function() {
		if (codeEditing) {
			saveObject(editWho, classes[editWho], false);
		}
		domLib.remClass(domEditCode, "menuAddFileVisible");
		codeEditing = false;
		editWho = "";
	});
	
	//handle room effects
	var makeRoom = function(name, obj, isNew) {
		//stringify object
		obj.name = name;
		var settings = JSON.stringify(obj);
		
		//runa ajax
		lib.ajax({cmd: "mkRoom", name: name, settings: settings}, function(e) {
			var ret = JSON.parse(e);
			if (lib.inArr(ret.err, 500)) {
				notify.queueNotification("error.png", "Error", "Could Not Make Code, Server Error<br/>Try restarting Generic Star.");
			} else {
				if (isNew) {
					notify.queueNotification("newgame.png", "Room Added","Created Room File:<br/> &nbsp; "+name);
					var node = createContentBox("rooms", loader.getCurrentGame(), name+".js", contentListing.rooms);
					contentListing.rooms.appendChild(node);
				}
				rooms[name] = obj;
			}
			
			domLib.remClass(domAddRooms, "menuAddFileVisible");
		});
	};
	
	clickaway.addClickaway(domAddRooms, function() {
		domLib.remClass(domAddRooms, "menuAddFileVisible");
		setRoomInputs(defaultRoom, domARoomInputs);
	});
	var editClickaway = function() {
		domLib.remClass(domEditRooms, "menuAddFileVisible");
		roomEditing = false;
	};
	clickaway.addClickaway(domEditRooms, editClickaway);
	domERoomBtn.addEventListener("click", function(e) {
		var obj = rooms[editRoomWho];
		obj.width  = parseInt(domERoomInputs[1].value);
		obj.height = parseInt(domERoomInputs[2].value);
		obj.vwidth = parseInt(domERoomInputs[3].value);
		obj.vheight= parseInt(domERoomInputs[4].value);
		makeRoom(editRoomWho, obj, false);
		triggerRoomRefresh();
		editClickaway();
	}, false);
	
	domARoomBtn.addEventListener("click", function(e) {
		var error = null;
		if (lib.isKeyword(domARoomInputs[0].value)) error = "You cannot use that word.";
		var filtered = lib.programmingFilter(domARoomInputs[0], false);
		if (filtered.length <= 0 && error === null) error = "You must name the room!";
		
		for(var roomName in rooms) {
			if (roomName.toLowerCase() === filtered.toLowerCase() && error === null) {
				error = "A room with that name<br/>already exists!";
			}
		}
		
		if (error !== null) {
			notify.queueNotification("error.png", "Error", error);
		} else {
			var newRoom = new Object();
			newRoom.width  = parseInt(domARoomInputs[1].value);
			newRoom.height = parseInt(domARoomInputs[2].value);
			newRoom.vwidth = parseInt(domARoomInputs[3].value);
			newRoom.vheight= parseInt(domARoomInputs[4].value);
			newRoom.objs   = new Array();
			makeRoom(filtered, newRoom, true);
			
			domLib.remClass(domAddRooms, "menuAddFileVisible");
			setRoomInputs(defaultRoom, domARoomInputs);
		}
	}, false);
	
	
	
	// -------------- PUBLIC FUNCTIONS -------------
	this.setMainPane = function(isEditor) {
		if (isEditor) {
			domLib.addClass(domNg, "sidebarNoGamesOff");
			domLib.remClass(domEditor,  "sidebarEditorOff");
		} else {
			domLib.remClass(domNg, "sidebarNoGamesOff");
			domLib.addClass(domEditor,  "sidebarEditorOff");
		}
		
		if (firstMPSet) {
			setTimeout(function() {
				domLib.addClass(domNg, "sidebarSlideAnim");
				domLib.addClass(domEditor,  "sidebarSlideAnim");
			}, 500);
			firstMPSet = false;
		}
	};
	
	this.replaceSidebarContent = function(type, urlArr) {
		if (!contentBoxes.hasOwnProperty(type)) return false;
		var cGame = loader.getCurrentGame();
		urls[type] = new Object();
		
		var replace = document.createElement("div");
		for(var i=0; i < urlArr.length; i++) {
			var node = createContentBox(type, cGame, urlArr[i], replace);
			replace.appendChild(node);
			urls[type][urlArr[i]] = true;
		}
		var node = document.createElement("br");
		node.style.clear = "both";
		
		contentListing[type] = replace;
		domLib.remChildren(contentBoxes[type]);
		contentBoxes[type].appendChild(replace);
		contentBoxes[type].appendChild(node);
		urlChangedEvent(type, new DataChangeEvent(DataChangeEvent.UPDATE, null, null));
		
		if (type === "code") setSelectedCode(null, null);
		if (type === "rooms") setSelectedRoom(null, null);
		
		return true;
	};
	
	this.replaceSidebarObjects = function(objs) {
		classes = new Object();
		for(var nm in objs) {
			var classNm = nm.slice(0, nm.lastIndexOf("."));
			classes[classNm] = generics.getStaticInstance(objs[nm].__type).generate(objs[nm]);
		};
	};
	
	this.replaceSidebarRooms = function(objs) {
		rooms = new Object();
		for(var nm in objs) {
			var roomNm = nm.slice(0, nm.lastIndexOf("."));
			rooms[roomNm] = objs[nm];
		};
	};
	
	/**
	 * Adds a callback function that will be called whenever
	 * the list of images changes.
	 * @param {Function} func the function to callback. It has one argument,
	 * 		the Sidebar.DataChangeEvent that describes what happened.
	 */
	this.addImageListChangedEvent = function(func) {
		urlEvents.images.push(func);
	};
	
	/**
	 * Adds a callback function that will be called whenever
	 * the list of sounds changes.
	 * @param {Function} func the function to callback. It has one argument,
	 * 		the Sidebar.DataChangeEvent that describes what happened.
	 */
	this.addSoundListChangedEvent = function(func) {
		urlEvents.sounds.push(func);
	};
	
	/**
	 * Adds a callback function that will be called whenever
	 * the currently selected room changes.
	 * @param {Function} func the callback, takes no arguments
	 */
	this.addRoomSelectChangedEvent = function(func) {
		roomChangeActions.push(func);
	};
	
	/**
	 * Constructs an array containing the current list of image
	 * URLs that this project has.
	 * @returns {Array} the array of strings (filenames) of images
	 */
	this.getImageList = function() {
		var ret = new Array();
		for(var label in urls.images) {
			ret.push(label);
		}
		
		return ret;
	};
	
	/**
	 * Constructs an array containing the current list of sound
	 * URLs that this project has.
	 * @returns {Array} the array of strings (filenames) of sounds
	 */
	this.getSoundList = function() {
		var ret = new Array();
		for(var label in urls.sounds) {
			ret.push(label);
		}
		
		return ret;
	};
	
	/**
	 * Gets whichever room is currently selected.
	 * @returns {Object} the currently selected room, or null
	 * 			if no room is selected.
	 */
	this.getCurrentlySelectedRoom = function() {
		return rooms[selectedRoom];
	};
	
	/**
	 * Gets whichever object is currently selected.
	 * @returns {GenericStar.Editor.Generics.Generic} the selected generic object, or
	 * 			null if no object is selected.
	 */
	this.getCurrentlySelectedObject = function() {
		if (selectedCode === null) return null;
		if (classes[selectedCode] === undefined) return null;
		return classes[selectedCode];
	};
	
	/**
	 * Gets the class name of the object that is currently selected
	 * @returns {String} the name of the object, or null if no object
	 * 			is currently selected.
	 */
	this.getCurrentlySelectedObjectName = function() {
		return selectedCode;
	};
	
	/**
	 * Gets the default "class" object for a given class name.
	 * @param className the name to look up
	 * @returns {GenericStar.Editor.Generics.Generic} the generic with
	 * 		the given name, or undefined if it doesn't exist.
	 */
	this.getClassInstance = function(className) {
		return classes[className];
	};
	
	/**
	 * Saves the currently selected room to disk (for use when modifying
	 * the room data structure).
	 */
	this.saveRoom = function() {
		var obj = rooms[selectedRoom];
		if (obj === undefined || obj === null) return;
		makeRoom(selectedRoom, obj, false);
		triggerRoomRefresh();
	};
	
	/**
	 * Sets the editor so this sidebar knows what to refresh
	 * @param {GenericStar.Editor.LevelEditor} e the editor to set
	 */
	this.setEditor = function(e) {
		editor = e;
	};
};

/**
 * Creates a data change event for when the sidebar changes data.
 * @class This class contains information on what data was changed in the sidebar.
 * @param {Number} type the type of change, one of DELETE, RENAME, or UPDATE (static properties of this class).
 * @param {String} origName the name before this data changed (can be null)
 * @param {String} newName the name after this data changed (can be null)
 */
GenericStar.Editor.Sidebar.DataChangeEvent = function(type, origName, newName) {
	this.type = type;
	this.name1 = origName;
	this.name2 = newName;
};
GenericStar.Editor.Sidebar.DataChangeEvent.DELETE = 1;
GenericStar.Editor.Sidebar.DataChangeEvent.RENAME = 2;
GenericStar.Editor.Sidebar.DataChangeEvent.UPDATE = 3;


/**
 * Creates a handler for the level editor.
 * @class This class handles drawing the current room, and allows the user to click to
 * 		add, edit, or remove classes within the room.
 * @param {Node} domMain the canvas node to draw on
 * @param {GenericStar.Editor.Sidebar} sidebar the sidebar to use selections from
 */
GenericStar.Editor.LevelEditor = function(domMain, sidebar) {
	var domCanvas = domMain.getElementsByClassName("editor")[0];
	var domScroll = domMain.getElementsByClassName("editorScroll")[0];
	var domWH     = domMain.getElementsByClassName("editorWH")[0];
	var domXY     = domMain.getElementsByClassName("editorXY")[0];
	
	var sprite = null;
	var ctx = domCanvas.getContext("2d");
	var view = {w: 1, h: 1};
	var grid = {w: 32, h: 32};
	var offset = {x: 0, y: 0};
	var mouse = {x: 0, y: 0, rx: 0, ry: 0};
	var room = null;
	
	var redraw = function() {
		ctx.clearRect(0,0, view.w, view.h);
		if (room !== null) {
			for(var i=0; i < room.objs.length; i++) {
				var obj = room.objs[i];
				var cls = sidebar.getClassInstance(obj.__psuedoClass);
				if (cls === null) continue;
				
				cls.child = obj;
				if (cls.isOnScreen(offset, view)) cls.draw(offset, view, ctx);
				cls.child = null;
			}
			
			
			ctx.beginPath();
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.lineWidth = 1;
			var x = grid.w - offset.x % grid.w;
			var y = grid.h - offset.y % grid.h;
			var maxx = Math.min(room.width - offset.x, offset.x + view.w);
			var maxy = Math.min(room.height- offset.y, offset.y + view.h);
			for(var i=x; i <= maxx; i+=grid.w) {
				ctx.moveTo(i, 0);
				ctx.lineTo(i, maxy);
			}
			
			for(var i=y; i <= maxy; i+=grid.h) {
				ctx.moveTo(0, i);
				ctx.lineTo(maxx, i);
			}
			ctx.stroke();
		}
	};
	
	var resize = function() {
		var w = parseInt(domCanvas.parentElement.offsetWidth) - 20;
		var h = parseInt(domCanvas.parentElement.offsetHeight) - 20;
		view.w = w;
		view.h = h;
		domCanvas.width = w;
		domCanvas.height= h;
		redraw();
	};
	resize();
	
	window.addEventListener("resize", resize, false);
	
	sidebar.addRoomSelectChangedEvent(function() {
		room = sidebar.getCurrentlySelectedRoom();
		if (room === undefined) room = null;
		if (room !== null) {
			domWH.style.width = room.width+"px";
			domWH.style.height= room.height+"px";
		}
		mouse.x = 0;
		mouse.y = 0;
		redraw();
	});
	
	domScroll.addEventListener("scroll", function(e) {
		offset.x = domScroll.scrollLeft;
		offset.y = domScroll.scrollTop;
		redraw();
	}, false);
	
	domMain.addEventListener("mousemove", function(e) {
		if (room === null) return;
		mouse.rx = parseInt(e.offsetX);
		mouse.ry = parseInt(e.offsetY);
		mouse.x = parseInt(mouse.rx / grid.w) * grid.w;
		mouse.y = parseInt(mouse.ry / grid.h) * grid.h;
		domXY.innerHTML = mouse.x+", "+mouse.y;
		
	}, false);
	
	domMain.addEventListener("mouseup", function(e) {
		if (room === null) return;
		
		if (e.button === 0) {
			if (mouse.x > room.width || mouse.y > room.height) return;
			var obj = sidebar.getCurrentlySelectedObjectName();
			if (obj === null) return;
			
			var newObj = {__psuedoClass: obj, x: mouse.x, y: mouse.y};
			room.objs.push(newObj);
			sidebar.saveRoom();
			
		} else if (e.button === 2) {
			var delID = -1;
			for(var i=0; i < room.objs.length && delID === -1; i++) {
				var obj = room.objs[i];
				var cls = sidebar.getClassInstance(obj.__psuedoClass);
				if (cls === null) continue;
				
				cls.child = obj;
				if (!cls.isOnScreen(offset, view)) continue;
				if (cls.contains(mouse.rx, mouse.ry)) delID = i;
				cls.child = null;
			}
			
			room.objs.splice(delID, 1);
			sidebar.saveRoom();
		}
		
		
	}, false);
	
	this.repaint = function() {
		redraw();
	};
};

window.onload = function(e) {
	var clickaway = new GenericStar.Editor.ClickawayHandler();
	var nc = new GenericStar.Editor.NotificationController(document.getElementById("notification"));
	var lib = new GenericStar.Editor.Library();
	var domLib = new GenericStar.Editor.DomHelper();
	
	// =============== ACTION HOOKS ===============
	
	
	//Load Game -----
	var btnLoad = document.getElementById("loadBtn");
	var loader = new GenericStar.Editor.GameLoader(btnLoad);
	
	//modal -----
	var modal = new GenericStar.Editor.ModalDialogs(document.getElementById("screen"), loader);
	
	//sidebar -----
	var sidebar = new GenericStar.Editor.Sidebar(document.getElementById("sidebar"), nc, loader, clickaway, modal);
	loader.setSidebar(sidebar);
	modal.setSidebar(sidebar);
	loader.addGameLoadedCallback(function(loaded) {
		sidebar.setMainPane(loaded);
	});
	loader.updateLoadBtn();
	
	//New Game -----
	var btnNew  = document.getElementById("newBtn");
	var menuNew = document.getElementById("menuNew");
	var menuInput= menuNew.getElementsByTagName("input")[0];
	var btnCreate=document.getElementById("createBtn");
	
	clickaway.addClickaway(menuNew, function() {
		domLib.remClass(menuNew, "menuNewVisible");
	});
	clickaway.addException(btnNew, menuNew, function(e) {
		menuInput.value = "";
		domLib.addClass(menuNew, "menuNewVisible");
	});
	
	menuInput.addEventListener('keyup', function(e) {
		var inputVal = menuInput.value;
		var newInput = lib.programmingFilter(menuInput, false);
		if (inputVal !== newInput) menuInput.value = newInput;
	}, true);
	
	btnCreate.addEventListener('click',function(e) {
		var error = null;
		if (lib.isKeyword(menuInput.value)) error = "You cannot use that word.";
		var newName = lib.programmingFilter(menuInput, true);
		if (newName.length <= 0 && error === null) error = "You must enter a name.";
		
		menuInput.value = "";
		domLib.remClass(menuNew, "menuNewVisible");
		
		if (error !== null) {
			nc.queueNotification("error.png", "Error", error);
			return;
		}
		
		lib.ajax({cmd:"new", name:newName}, function(ret) {
			ret = JSON.parse(ret);
			if (ret.err.length > 0 && lib.inArr(ret.err, "Already Exists")) {
				nc.queueNotification("error.png", "Error", "A game is already named that!");
			} else {
				nc.queueNotification("newgame.png", "Game Made", "Game made with name:<br/>"+newName);
				lib.ajax({cmd: "select", selected: newName}, function(){
					loader.updateLoadBtn();
				});
			}
		});
	}, true);
	
	//Level Editor ------
	var canvas = document.getElementById("main");
	var editor = new GenericStar.Editor.LevelEditor(canvas, sidebar);
	sidebar.setEditor(editor);
};