GenericStar.Editor.Generics = new Object();

/**
 * Creates a pointer to the reverse key map.
 * @class Simply a mapping of keycodes to their string name.
 */
GenericStar.Editor.ReverseKeyMap = function() {};
GenericStar.Editor.ReverseKeyMap.prototype.getKeyString = function(keycode) {
	if (keycode === undefined) return null;
	
	if (keycode >= 65  && keycode <= 90)  return String.fromCharCode(keycode);
	if (keycode >= 48  && keycode <= 57)  return ""+(keycode - 48);
	if (keycode >= 96  && keycode <= 105) return "NumPad "+(keycode-96);
	if (keycode >= 112 && keycode <= 123) return "F"+(keycode-111);
	
	return this.remainingKeyStrings[""+keycode];
};
GenericStar.Editor.ReverseKeyMap.prototype.remainingKeyStrings = {
	"8": "Backspace",
	"13": "Enter", "16": "Shift", "17": "Ctrl", "18": "Alt",
	"27": "Escape",
	"32": "Spacebar",
	"33": "Page Up", "34": "Page Down",
	"35": "End", "35": "Home",
	"37": "Left", "38": "Up", "39": "Right", "40": "Down",
	"45": "Insert", "46": "Delete",
	"91": "Windows",
	"106": "NumPad *", "107": "NumPad +", "109": "NumPad -", "110": "Numpad .", "111": "Numpad /",
	"192": "~", "189": "-", "187": "+", "188": "&lt;", "190": "&gt;", "191": "?",
	"219": "[", "221": "]", "220": "|", "186": ":", "222": "&quot;"
};



/**
 * Creates a link to the manifest of all generic objects.
 * @class Simply a mapping of strings to class names of all the generics.
 */
GenericStar.Editor.Generics.GenericManifest = function() {
	var generics = {
		"Player": new GenericStar.Editor.Generics.Player(),
		"Block":  new GenericStar.Editor.Generics.Block()
	};
	
	var genericList = new Array();
	for(var prop in generics) {
		genericList.push(prop);
	}
	
	/**
	 * Gets a Generic object that is the default object (to be cloned).
	 * @param str the string name to look up
	 * @returns {GenericStar.Editor.Generics.Generic} the generic representing that object
	 */
	this.getStaticInstance = function(str) {
		return generics[str];
	};
	
	/**
	 * Gets a list of the names of all the generics.
	 * @returns {Array} an array of the names of the generics
	 */
	this.getInstanceList = function() {
		return genericList;
	};
};

/**
 * Creates a generic object. Not very useful, this is an interface class.
 * @class The shared class containing methods that all generics need to support.
 * @param {Object} template the template to use to construct this generic
 */
GenericStar.Editor.Generics.Generic = function(template) {
	for(var lbl in template) {
		this.setP(lbl, template[lbl].value);
	}
	
	this.template = template;
};
GenericStar.Editor.Generics.Generic.prototype.child = null;
GenericStar.Editor.Generics.Generic.prototype.getP = function(param) {
	if (this.child !== null && this.child[param] !== undefined) {
		return this.child[param];
	} else return this[param];
};
GenericStar.Editor.Generics.Generic.prototype.setP = function(param, value) {
	if (this.child !== null) this.child[param] = value;
	else this[param] = value;
};


GenericStar.Editor.Generics.Generic.prototype.draw = function(canvas) {};
GenericStar.Editor.Generics.Generic.prototype.generate = function() {
	return new GenericStar.Editor.Generics.Generic();
};

/**
 * Creates a panel for setting the settings that this object contains.
 * @param {GenericStar.Editor.ModalDialogs} modal a pointer to the modal dialog handler being used
 */
GenericStar.Editor.Generics.Generic.prototype.makeSettingPanel = function(modal) {
	var rkm = new GenericStar.Editor.ReverseKeyMap();
	var self = this;
	
	var dom = document.createElement("div");
	
	var makeSettingRow = function(prop) {
		var row = null;
		if (self.template[prop].input.type === "keyboard") {
			row = document.createElement("div");
			row.className = "genericPropertyRow";
			
			var keyText = document.createElement("div");
			keyText.className = "genericPropText";
			keyText.innerHTML = self.template[prop].name+": "+rkm.getKeyString(self.getP(prop));
			
			var keyBtn = document.createElement("div");
			keyBtn.innerHTML = "Set";
			keyBtn.className = "genericPropBtn button2";

			var keyInput = document.createElement("input");
			keyInput.type = "text";
			keyInput.className = "genericPropHiddenInput";
			
			var waitingInput = false;
			keyBtn.addEventListener("click", function(e) {
				keyBtn.innerHTML = "Press Any Key";
				keyInput.focus();
			}, false);
			
			keyInput.addEventListener("keyup", function(e) {
				var keyStr = rkm.getKeyString(e.keyCode);
				if (keyStr !== undefined && keyStr !== null) {
					self.setP(prop, e.keyCode);
					keyText.innerHTML = self.template[prop].name+": "+rkm.getKeyString(self.getP(prop));
				}
				
				keyInput.value = "";
				keyInput.blur();
				
			}, false);
			
			keyInput.addEventListener("blur", function(e) {
				keyBtn.innerHTML = "Set";
			}, false);
			
			row.appendChild(keyText);
			row.appendChild(keyBtn);
			row.appendChild(keyInput);
		}
		
		if (self.template[prop].input.type === "int" || self.template[prop].input.type === "float" ||
			self.template[prop].input.type === "playerWidth" || self.template[prop].input.type === "playerHeight") {
			var int = self.template[prop].input.type !== "float";
			var pw  = self.template[prop].input.type === "playerWidth";
			var ph  = self.template[prop].input.type === "playerHeight";
			var min = self.template[prop].input.min;
			var max = self.template[prop].input.max;
			
			row = document.createElement("div");
			row.className = "genericPropertyRow";
			
			var keyText = document.createElement("div");
			keyText.className = "genericPropText";
			keyText.innerHTML = self.template[prop].name+": ";
			
			var keyInput = document.createElement("input");
			keyInput.type = "number";
			if (min !== undefined) keyInput.min = min;
			if (max !== undefined) keyInput.max = max;
			if (int) keyInput.step = 1;
			keyInput.value = self.getP(prop);
			keyInput.className = "genericPropNumber";
			
			var inputFilter = function(val) {
				if (int) val = parseInt(val);
				else val = parseFloat(val);
				if (min !== undefined) val = Math.max(min, val);
				if (max !== undefined) val = Math.min(max, val);
				if (pw && self.getP("height") !== undefined) val = Math.min(self.getP("height"), val);
				if (ph && self.getP("width")  !== undefined) val = Math.max(self.getP("width"),  val);
				
				return val;
			};
			var prevVal = keyInput.value;
			keyInput.addEventListener("blur", function(e) {
				var filtered = inputFilter(keyInput.value);
				if (filtered !== prevVal) {
					keyInput.value = filtered;
					self.setP(prop, filtered);
					prevVal = filtered;
				}
			}, false);
			
			row.appendChild(keyText);
			row.appendChild(keyInput);
		}
		
		if (self.template[prop].input.type === "checkbox") {
			row = document.createElement("div");
			row.className = "genericPropertyRow";
			
			var keyText = document.createElement("div");
			keyText.className = "genericPropText";
			keyText.innerHTML = self.template[prop].name;
			
			var check = document.createElement("input");
			check.type = "checkbox";
			check.checked = self.getP(prop) === 1;
			check.className = "genericPropCheckbox";
			
			var oncheck = function(swap) {
				return function(e) {
					if (swap) check.checked = !check.checked;
					self.setP(prop, check.checked ? 1 : 0);
				};
			};
			keyText.addEventListener("click", oncheck(true), false);
			check.addEventListener("change", oncheck(false), false);
			
			row.appendChild(check);
			row.appendChild(keyText);
		}
		
		if (self.template[prop].input.type === "sprite") {
			row = document.createElement("div");
			row.className = "genericPropertyRow";
			
			var val = (self.getP(prop) === null) ? "No Image" : self.getP(prop).url;
			
			var keyText = document.createElement("div");
			keyText.className = "genericPropText";
			keyText.innerHTML = self.template[prop].name+":<br/>"+val;
			
			var keyBtn = document.createElement("div");
			keyBtn.innerHTML = "Set";
			keyBtn.className = "genericPropBtn button2";
			
			keyBtn.addEventListener("click", function(e) {
				modal.showImageDialog(self.getP(prop), function(newVal) {
					if (newVal === undefined) newVal = null;
					self.setP(prop, newVal);
					var val = (self.getP(prop) === null) ? "No Image" : self.getP(prop).url;
					keyText.innerHTML = self.template[prop].name+":<br/>"+val;
				});
			}, false);
			
			row.appendChild(keyText);
			row.appendChild(keyBtn);
		}
		
		if (self.template[prop].input.type === "sound") {
			row = document.createElement("div");
			row.className = "genericPropertyRow";
			
			var val = (self.getP(prop) === null) ? "No Sound" : self.getP(prop).url;
			
			var keyText = document.createElement("div");
			keyText.className = "genericPropText";
			keyText.innerHTML = self.template[prop].name+":<br/>"+val;
			
			var keyBtn = document.createElement("div");
			keyBtn.innerHTML = "Set";
			keyBtn.className = "genericPropBtn button2";
			
			keyBtn.addEventListener("click", function(e) {
				modal.showSoundDialog(self.getP(prop), function(newVal) {
					if (newVal === undefined) newVal = null;
					self.setP(prop, newVal);
					var val = (self.getP(prop) === null) ? "No Sound" : self.getP(prop).url;
					keyText.innerHTML = self.template[prop].name+":<br/>"+val;
				});
			}, false);
			
			row.appendChild(keyText);
			row.appendChild(keyBtn);
		}
		
		return row;
	};
	
	var row = null;
	for(var prop in this.template) {
		var tmpRow = makeSettingRow(prop);
		if (tmpRow !== null) {
			row = tmpRow;
			dom.appendChild(row);
		}
	}
	row.className += " genericPropertyRowEnd";
	
	return dom;
};

/**
 * Creates a copy of this object with the unique variables copied.
 * Note that this ignores the child (thus should not be called by a psuedo-instance)
 * @param {Object} the object to copy unique variables from (optional, if not included, uses this)
 * @returns {GenericStar.Editor.Generics.Generic} the new generic
 */
GenericStar.Editor.Generics.Generic.prototype.generate = function(obj) {
	var ret = this.getSelf();
	if (!obj) obj = this;
	for(var name in this.template) {
		if (obj[name] !== ret[name]) ret[name] = obj[name];
	}
	return ret;
};

GenericStar.Editor.Generics.Generic.prototype.getParams = function() {
	var ret = new Object();
	for(var name in this.template) {
		ret[name] = this[name];
	}
	
	return ret;
};

/**
 * Updates this object's values to refelect a change in resources.
 * @param {String} type the type of resource change (either "sprite" or "sound")
 * @param {GenericStar.Editor.Sidebar.DataChangeEvent} event the data that was changed
 * @returns {Boolean} true if any parameter was updated as a result of this event, false
 * 		if the object was not changed.
 */
GenericStar.Editor.Generics.Generic.prototype.updatePointers = function(type, event) {
	var changed = false;
	var Dce = GenericStar.Editor.Sidebar.DataChangeEvent;
	for(var name in this.template) {
		var datatype = this.template[name].input.type;
		if (datatype === type && this.getP(name) !== null && this.getP(name).url === event.name1) {
			if (event.type === Dce.RENAME) this.getP(name).url = event.name2;
			if (event.type === Dce.DELETE) this.setP(name, null);
			
			changed = changed || (event.type === Dce.RENAME) || (event.type === Dce.DELETE);
		}
	}
	
	console.log(changed);
	return changed;
};

GenericStar.Editor.Generics.Generic.prototype.isOnScreen = function(offset, view) {
	var x = this.getP("x");
	var y = this.getP("y");
	var w = this.getP("width");
	var h = this.getP("height");
	
	if (!x || !y || !w || !h) return true;
	
	var ptCenter = {x: offset.x + view.w/2, y: offset.y + view.h/2};
	
	var sqr = function(x) {return x*x;};
	
	var dt1 = Math.sqrt(sqr(view.w/2) + sqr(view.h/2));
	var dt2 = Math.sqrt(sqr(w/2) + sqr(h/2));
	var dist = Math.sqrt(sqr(ptCenter.x - x) + sqr(ptCenter.y - y));
	
	return dist <= (dt1+dt2);
};

GenericStar.Editor.Generics.Generic.prototype.contains = function(px, py) {
	var x = this.getP("x");
	var y = this.getP("y");
	var w = this.getP("width");
	var h = this.getP("height");
	var r = this.getP("rotation");
	
	if (!x || !y || !w || !h) return false;
	if (!r) r = 0;
	r = -r * Math.PI / 180;
	var hw = w/2;
	var hh = h/2;
	px = px - x;
	py = y - py;
	var px2 = px * Math.cos(r) - py * Math.sin(r);
	var py2 = px * Math.sin(r) + py * Math.cos(r);
	
	return (px2 >= -hw && px2 <= hw && py2 >= -hh && py2 <= hh);
};

//------------- PLAYER ------------
GenericStar.Editor.Generics.Player = function() {};
GenericStar.Editor.Generics.Player.prototype = new GenericStar.Editor.Generics.Generic({
	ctrlLeft: {name: "Key Move Left", input: {type: "keyboard"}, value: GenericStar.Input.Key.left},
	ctrlRight:{name: "Key Move Right",input: {type: "keyboard"}, value: GenericStar.Input.Key.right},
	ctrlUp:   {name: "Key Jump",      input: {type: "keyboard"}, value: GenericStar.Input.Key.up},
	ctrlRun:  {name: "Key Run",       input: {type: "keyboard"}, value: GenericStar.Input.Key.z},
	
	x: {name: "X", input: {type: "int", min: 0}, value: 0},
	y: {name: "Y", input: {type: "int", min: 0}, value: 0},
	
	sprRight:{name: "Image (Facing Right)", input: {type: "sprite"}, value: null},
	sprRWalk:{name: "Image (Walking Right)", input: {type: "sprite"}, value: null},
	sprRJump:{name: "Image (Jumping Right)", input: {type: "sprite"}, value: null},
	
	sndJump: {name: "Jump Sound", input: {type: "sound"}, value: null},
	
	width: {name: "Width", input: {type: "playerWidth", min: 10, max: 400}, value: 30},
	height:{name: "Height",input: {type: "playerHeight",min: 10, max: 400}, value: 70},
	
	walkSpeed: {name: "Walking Speed", input: {type: "float", min: 50, max: 400}, value: 200},
	runSpeed:  {name: "Running Speed", input: {type: "float", min: 50, max: 800}, value: 300},
	
	airTravelFactor: {name: "Air Speed Reduction", input: {type: "float", min: 0, max: 2}, value: 1},
	jumpSpeed:  {name: "Jump Length", input: {type: "int",   min: 2, max: 8}, value: 4},
	jumpTime:   {name: "Jump Speed",  input: {type: "float", min: 600, max: 1400}, value: 800},
	
	wallJump:   {name: "Wall Jump", input: {type: "checkbox"}, value: 1},
	wallStick:  {name: "Sticky Walls", input: {type: "int", min: 0, max: 10}, value: 1},
	wallReduce: {name: "Wall Slide Slowdown", input: {type: "float", min: 0.01, max: 1}, value: 1}
});
GenericStar.Editor.Generics.Player.prototype.getSelf = function() {
	return new GenericStar.Editor.Generics.Player();
};
GenericStar.Editor.Generics.Player.prototype.__type = "Player";
GenericStar.Editor.Generics.Player.prototype.draw = function(offset, view, ctx) {
	//TODO needs to take all parameters into account
	var r = this.getP("rotation") * Math.PI / 180;
	var x = this.getP("x");
	var y = this.getP("y");
	var w = this.getP("width");
	var h = this.getP("height");
	ctx.fillStyle = "red";
	ctx.translate(x, y);
	ctx.rotate(-r);
	ctx.fillRect(-w/2, -h/2, w, h);
	ctx.rotate(r);
	ctx.translate(-x, -y);
};

//------------- BLOCK ------------
GenericStar.Editor.Generics.Block = function() {};
GenericStar.Editor.Generics.Block.prototype = new GenericStar.Editor.Generics.Generic({
	spr: {name: "Sprite", input:{type: "sprite"}, value: null},
	
	x: {name: "X", input: {type: "int", min: 0}, value: 0},
	y: {name: "Y", input: {type: "int", min: 0}, value: 0},
	
	rotation: {name: "Rotation", input: {type: "int", min: 0, max: 360}, value: 0},
	width: {name: "Width", input: {type: "int", min: 10, max: 2000}, value: 50},
	height:{name: "Height",input: {type: "int" ,min: 10, max: 2000}, value: 50},
	
	free: {name: "Free", input: {type: "checkbox"}, value: 0}
});
GenericStar.Editor.Generics.Block.prototype.getSelf = function() {
	return new GenericStar.Editor.Generics.Block();
};
GenericStar.Editor.Generics.Block.prototype.__type = "Block";
GenericStar.Editor.Generics.Block.prototype.draw = function(offset, view, ctx) {
	//TODO needs to take all parameters into account
	var r = this.getP("rotation") * Math.PI / 180;
	var x = this.getP("x") - offset.x;
	var y = this.getP("y") - offset.y;
	var w = this.getP("width");
	var h = this.getP("height");
	ctx.fillStyle = "grey";
	ctx.translate(x, y);
	ctx.rotate(-r);
	ctx.fillRect(-w/2, -h/2, w, h);
	ctx.rotate(r);
	ctx.translate(-x, -y);
};