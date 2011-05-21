//REMOVE ME


//ACTUAL LIBRARY
var GenericStar = {};

/**
 * Creates a new Core for Generic Star. The core handles holding instances of all other
 * useful Generic Star objects.
 * @param {Node} domGraphics the DOM Canvas object that we will be drawing to
 * @param {Boolean} usePhysics whether or not to use the Box2D Physics Engine
 * @param {Object} gravity an object containing x and y, which represent x and y
 * 			components of the generic gravity force. Can be null for no gravity.
 */
GenericStar.Core = function(domGraphics, usePhysics, gravity) {
	var useGrav = true;
	if (gravity === null) {
		gravity = {x: 0, y: 0};
		useGrav = false;
	}
	this.DEBUG = true;
	this.input = new GenericStar.Input();
	this.input.attachMouseListener(domGraphics);
	this.sound = new GenericStar.Sound();
	if (usePhysics) this.physics = new GenericStar.Physics.Controller(this, gravity);
	this.graphics = null;
	
	this.start = function(stepCallback) {
		this.graphics = new GenericStar.Graphics(this, domGraphics, stepCallback);
	};
	
	/**
	 * Gets whether or not we are using gravity in this game.
	 * @returns {Boolean} true if we are using gravity.
	 */
	this.isUsingGravity = function() {
		return useGrav;
	};
};

/**
 * Creates a Graphics Handler. Only the core should create these.
 * @class Handles drawing to the canvas.
 * @param {GenericStar.Core} core the core object
 * @param {Canvas} canvas the canvas we are drawing to
 * @param {Function} drawCallback {(GenericStar.Graphics):()} 
 * 			A function that gets called at the draw stage of each frame
 */
GenericStar.Graphics = function(core, canvas, drawCallback) {
	var GfxPlugins = {WebGL: {}, Canvas: {}};
	
	GfxPlugins.WebGL.init = false;
	
	var canvasSize = {
		w: 640,
		h: 480
	};
	
	/**
	 * Creates a WebGL Plugin.
	 * @class This plugin handles drawing in an OpenGL context.
	 * @param {Canvas} canvas the canvas to draw to
	 * @param {GenericStar.Graphics} gfx the Graphics object that spawned this (contains global settings)
	 * @param {Function} drawCallback {(GfxPlugins.WebGL):()} this function is called every frame
	 * 						in the main draw loop
	 */
	GfxPlugins.WebGL = function(canvas, gfx, drawCallback) {
		//PRIVATE VARIABLES
		var gl;
		var shaderProgram;
		var lastTime = 0;
		
		var vertexPositionBuffer;
		var vertexTextureCoordBuffer;
		var thisPlugin = this;
		
		var canvasWidth = 1;
		var canvasHeight= 1;
		
		//PRIVATE FUNCTIONS-----------------------------------
		//SHADER FUNCTIONS
		/**
		 * Loads a shader from source code. If failure, can print to debug log.
		 * @param type of shader (gl.GL_VERTEX_SHADER or gl.GL_FRAGMENT_SHADER)
		 * @param {String} shaderSrc source code to load as a shader
		 * @returns {Shader} the shader object created by GL
		 */
		function loadShader(type, shaderSrc) {
			var shader = gl.createShader(type);
			if (shader == 0) return 0;
			gl.shaderSource(shader, shaderSrc);
			gl.compileShader(shader);
			var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

			if (!compiled && core.DEBUG) {
				console.error("COULD NOT COMPILE SHADER: ["+gl.getShaderInfoLog(shader)+"]");
				gl.deleteShader(shader);
				return 0;
			}
			return shader;
		}

		/**
		 * Loads a program consisting of a vertex and fragment shader into the GL context.
		 * @param {Shader} vertShaderSrc the vertex shader
		 * @param {Shader} fragShaderSrc the fragment shader
		 */
		function loadGlProgram(vertShaderSrc, fragShaderSrc) {
			var programObject;
			var linked;

			// Load the vertex/fragment shaders
			var vertexShader = loadShader(gl.VERTEX_SHADER, vertShaderSrc);
			if (vertexShader == 0) return 0;
			var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragShaderSrc);
			if (fragmentShader == 0) {
				gl.deleteShader(vertexShader);
				return 0;
			}

			// Create the program object
			programObject = gl.createProgram();
			if (programObject == 0) return 0;
			gl.attachShader(programObject, vertexShader);
			gl.attachShader(programObject, fragmentShader);
			gl.linkProgram(programObject);
			linked = gl.getProgramParameter(programObject, gl.LINK_STATUS);

			if (!linked && core.DEBUG) {
				console.error("COULD NOT LINK GL PROGRAM: ["+gl.getProgramInfoLog(programObject)+"]");
				gl.deleteProgram(programObject);
				return 0;
			}
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			return programObject;
		}
		
	    //CONSTRUCTOR CODE========================================
		if (!GfxPlugins.WebGL.init) {
			//TODO: init html stuff here with html dom injection
			GfxPlugins.WebGL.init = true;
		}
		
		//Init GL
		try {
	        gl = canvas.getContext("experimental-webgl");
	        gl.viewportWidth = canvas.width;
	        gl.viewportHeight = canvas.height;
	    } catch (e) {}
	    if (!gl && core.DEBUG) {
	        console.error("FATAL ERROR: Could not initialise WebGL.");
	    }
	    
	    var shaderProgram = loadGlProgram(
	    	//VERTEX SHADER
	       "attribute vec3 aVertexPosition;	\n\
	    	attribute vec2 aTextureCoord;	\n\
	    	uniform mat4 uMVMatrix;			\n\
	    	uniform mat4 uPMatrix;			\n\
	    	varying vec2 vTextureCoord;		\n\
	    	void main(void) {				\n\
	    		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);	\n\
	    		vTextureCoord = aTextureCoord;	\n\
	    	}",
	    
	    	//FRAGMENT SHADER
		   "#ifdef GL_ES 				\n\
		 		precision highp float; 	\n\
			#endif						\n\
			varying vec2 vTextureCoord;	\n\
			uniform sampler2D uSampler; \n\
			void main(void) {			\n\
				gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));		\n\
			}"
	    );

        gl.useProgram(shaderProgram);
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        shaderProgram.textureCoordAttribute   = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform  = gl.getUniformLocation(shaderProgram, "uSampler");
	    gl.clearColor(0.0, 0.0, 0.0, 1.0);
	    gl.disable(gl.GL_DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	    
	    //Init transform matrices
	    var mvMatrix = mat4.create();
	    var mvMatrixStack = [];
	    var pMatrix = mat4.create();
	    
	    //Init Buffers
	    var cubeVertexTextureCoordBuffer = gl.createBuffer();
	    var cubeVertexPositionBuffer = gl.createBuffer();
	    var linePosBuffer = gl.createBuffer();
	    var lineColBuffer = gl.createBuffer();
	    
	    
	    //PRIVATE METHODS---------------------------------
	    var degToRad = function(degrees) {
	        return degrees * Math.PI / 180;
	    };

	    var drawframe = function() {
	        requestAnimFrame(drawframe);
	        
	        canvasWidth = gfx.getCanvasWidth();
	        canvasHeight = gfx.getCanvasHeight();
	        //console.log(gl.viewportWidth+", "+gl.viewportHeight);
	        //gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	        gl.viewport(0, 0, canvasWidth, canvasHeight);
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        gl.hint(gl.GL_PERSPECTIVE_CORRECTION_HINT,gl.GL_NICEST);
	        mat4.ortho(0, canvasWidth, canvasHeight, 0, 0, 1, pMatrix);
	        
	        drawCallback(thisPlugin);
	        
	        //calculate fps
	        var timeNow = new Date().getTime();
	        if (lastTime != 0) {
	            var elapsed = timeNow - lastTime;
	        }
	        lastTime = timeNow;
	    };
	    
	    //PUBLIC METHODS-----------------------------------
	    /**
	     * This function loads an image into OpenGL Memory. Note that if you are using
	     * the scaffolding, this is all taken care of by the Sprite Handler, and you should
	     * probably be using <code>getImage</code> to get sprites for drawing.
	     * @param {String} img the filename of the image to load in
	     * @param {Function} callback {(GfxPlugins.WebGL.Texture):()} this function is called upon completion of loading
	     * @param {Boolean} [tile] true if you plan on tiling this image. 
	     * 			If true, the image must have width and height values that are powers of two.
	     */
	    this.loadImage = function(img, callback, tile) {
	    	if (tile == undefined) tile = false;
	    	var texRet = new GfxPlugins.WebGL.Texture(gl.createTexture(), new Image(), tile);
	    	texRet.image.onload = function () {
	    		gl.bindTexture(gl.TEXTURE_2D, texRet.texture);
	    		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	    	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texRet.image);
	    	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	    	    if (!texRet.tile) {
	    	    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //fix power of 2
		    	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //fix power of 2
	    	    } else {
	    	    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //fix power of 2
		    	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //fix power of 2
	    	    }
	    	    gl.generateMipmap(gl.TEXTURE_2D);
	    	    gl.bindTexture(gl.TEXTURE_2D, null);
	    	 
	    	    var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	    	    if (core.DEBUG && (texRet.image.width > maxSize || texRet.image.height > maxSize)) {
	    		    console.error("ERROR: Your hardware cannot load textures of this size.");
	    	    }
	    	    
	    	    callback(texRet);
	        };

	        texRet.image.src = img;
	    };
	    
	    
	    /**
	     * Draws a given texture tiled to a given dimension.
	     * @param {GfxPlugins.WebGL.Texture} tex the texture to draw. Note - it must be enabled to tile when you loaded it.
	     * @param {Number} x the x position (in pixels) to draw at
	     * @param {Number} y the y position (in pixels) to draw at
	     * @param {Number} w the width in pixels of the image
	     * @param {Number} h the height in pixels of the image
	     * @param {Number} [rot=0] the rotation of the image once drawn (in degrees).
	     * @param {Number} [cx=0] the center of the image to rotate about.
	     * @param {Number} [cy=0] the center of the image to rotate about.
	     * @param {Number} [rx=1] the number of times to tile this image horizontally
	     * @param {Number} [ry=1] the number of times to tile this image vertically
	     */
	    this.drawSpriteTiled = function(tex, x, y, w, h, rot, cx, cy, rx, ry) {
	    	if (core.DEBUG && !tex.tile) console.error("Error: cannot tile this image ["+tex.image.src+"]");
	    	var imgw = parseInt(tex.image.width);
	    	var imgh = parseInt(tex.image.height);
	    	if (rx == undefined) rx = 1;
	    	if (ry == undefined) ry = 1;
	    	if (rx <= 0) rx = 1;
	    	if (ry <= 0) ry = 1;
	    	this.drawSprite(tex, x, y, w, h, rot, cx, cy, 0, 0, 1/rx, 1/ry);
	    };
	    
	    /**
	     * Draws a given texture tiled to a given dimension.
	     * @param {GfxPlugins.WebGL.Texture} tex the texture to draw. Note - it must be enabled to tile when you loaded it.
	     * @param {Number} x the x position (in pixels) to draw at
	     * @param {Number} y the y position (in pixels) to draw at
	     * @param {Number} [w] the width in pixels of the image
	     * @param {Number} [h] the height in pixels of the image
	     * @param {Number} [rot=0] the rotation of the image once drawn (in degrees).
	     * @param {Number} [cx=0] the center of the image to rotate about.
	     * @param {Number} [cy=0] the center of the image to rotate about.
	     * @param {Number} [fx=0] the x frame index to use if this is a sprite-sheet
	     * @param {Number} [fy=0] the y frame index to use if this is a sprite-sheet
	     * @param {Number} [fw=1] how many columns of sprites there are in this sprite-sheet
	     * @param {Number} [fh=1] how many rows of sprites there are in this sprite-sheet
	     */
	    this.drawSprite = function(tex, x, y, w, h, rot, cx, cy, fx, fy, fw, fh) {
	    	if (x == undefined) x = 0;
	    	if (y == undefined) y = 0;
	    	if (rot == undefined) rot = 0;
	    	if (cx == undefined) cx = 0;
	    	if (cy == undefined) cy = 0;
	    	if (fx == undefined) fx = 0;
	    	if (fy == undefined) fy = 0;
	    	if (fw == undefined) fw = 1;
	    	if (fh == undefined) fh = 1;
	    	fx /= fw;
	    	fy /= fh;
	    	fw = 1 / fw;
	    	fh = 1 / fh;
	    	if (w == undefined) w = parseInt(tex.image.width) * fw;
	    	if (h == undefined) h = parseInt(tex.image.height)* fh;
	    	
	    	rot = -rot * Math.PI / 180;
	    	cx *= -1;
	    	cy *= -1;
	    	
	    	var vertices = [
	              cx, cy+h,  0.0,
	              cx+w, cy+h,  0.0,
	              cx+w, cy,  0.0,
	              cx, cy,  0.0 ];
	    	
    		var cells = (vertices.length / 3)*2;
	    	var cellRepeat = [fx, fy, fx+fw, fy, fx+fw, fy+fh, fx, fy+fh];
	    	texCoords = [];
	    	for(var i=0; i < cells; i++) {
	    		texCoords[i] = cellRepeat[i % cellRepeat.length];
	    	}
	    	
	    	if (texCoords.length % 8 != 0 && core.DEBUG) console.warn("DrawSprite Warning: texcoords error: ["+texCoords+"]");
	    	
	    	mat4.identity(mvMatrix);
	        mat4.translate(mvMatrix, [x, y, 0.0]);
	        mat4.rotateZ(mvMatrix, rot);
	    	this.draw3D(vertices, texCoords, tex);
	    };
	    
	    /**
	     * Draws a 3D Texture to the WebGL Canvas. Only use if you know what you're doing.
	     * @param {Number[]} vertcoord the vertex coordinates to use in drawing
	     * @param {Number[]} texcoord the texture coordinates to use in drawing
	     * @param {GfxPlugins.WebGL.Texture} texture the texture to draw
	     */
	    this.draw3D = function(vertcoord, texcoord, texture) {
	    	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	    	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertcoord), gl.STATIC_DRAW);
	        cubeVertexPositionBuffer.itemSize = 3;
	        cubeVertexPositionBuffer.numItems = vertcoord.length / 3;
	        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	        
		    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoord), gl.STATIC_DRAW);
	        cubeVertexTextureCoordBuffer.itemSize = 2;
	        cubeVertexTextureCoordBuffer.numItems = texcoord.length / 2;
	        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	    	
	    	gl.activeTexture(gl.TEXTURE0);
	        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
	        gl.uniform1i(shaderProgram.samplerUniform, 0);
	        gl.texParameteri ( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
	        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	        gl.drawArrays(gl.TRIANGLE_FAN, 0, cubeVertexPositionBuffer.numItems);
	    };
	    
	    drawframe();
	};
	
	/**
	 * Creates a new Texture object. Used internally; simply
	 * pass it into WebGL methods, don't try to use it or modify its
	 * parameters manually.
	 * @class Represents a texture that can be drawn in WebGL
	 * @param {GLTexture} tex the texture
	 * @param {Image} image the DOM Image this texture was loaded from
	 * @param {Boolean} tile whether or not this texture supports tiling
	 */
	GfxPlugins.WebGL.Texture = function(tex, image, tile) {
		this.texture = tex;
		this.image = image;
		this.tile = tile;
	};
	
	/**
	 * Sets the size of the canvas we're plugged into.
	 * @param {Number} w the new width of the canvas
	 * @param {Number} h the new height of the canvas
	 */
	this.setCanvasSize = function(w, h) {
		w = (w <= 0) ? 1 : w;
		h = (h <= 0) ? 1 : h;
		canvasSize.w = w;
		canvasSize.h = h;
	};
	
	/**
	 * Gets the width of the canvas
	 * @returns {Number} the width of the canvas
	 */
	this.getCanvasWidth = function() {
		return canvasSize.w;
	};
	
	/**
	 * Gets the height of the canvas
	 * @returns {Number} the height of the canvas
	 */
	this.getCanvasHeight = function() {
		return canvasSize.h;
	};
	
	/**
	 * Gets the plugin that is currently being used.
	 * @returns {GfxPlugins.WebGL} the web gl plugin
	 */
	this.getPlugin = function() {
		return gfxPlugin;
	};
	
	//final init code
	var gfxPlugin = new GfxPlugins.WebGL(canvas, this, drawCallback);
};

/**
 * Creates an Input Handler.
 * @class This class handles listening for keyboard / mouse input.
 */
GenericStar.Input = function() {
	var keyState = new Array();
	var btnState = new Array();
	
	var attached = false;
	var mousePos = {x: 0, y: 0};
	var mouseState = new Array();
	var mouseBtn = new Array();
	
	window.onkeydown = function(e) {
		keyState[e.keyCode] = true;
		btnState[e.keyCode] = true;
	};
	
	window.onkeyup = function(e) {
		keyState[e.keyCode] = false;
		btnState[e.keyCode] = false;
	};
	
	/**
	 * Gets whether or not a key is being pressed.
	 * @param {Number} key the key to check. For possible keys, see GenericStar.Input.Key.
	 * @returns {Boolean} true if the key is being pressed
	 */
	this.isKeyDown = function(key) {
		btnState[key] = false;
		return keyState[key];
	};
	
	/**
	 * Gets whether or not a key has just been tapped.
	 * @param {Number} key the key to check. For possible keys, see GenericStar.Input.Key.
	 * @returns {Boolean} true if the key has just been pressed and is not being held.
	 */
	this.isKeyDownBtn = function(key) {
		var ret = btnState[key];
		btnState[key] = false;
		return ret;
	};
	
	/**
	 * Gets whether or not a mouse button is down.
	 * @param {Number} mouse the button to check against. For a list of buttons, see GenericStar.Input.Mouse.
	 * @returns {Boolean} true if pressed, false otherwise.
	 */
	this.isMouseDown = function(mouse) {
		mouseBtn[mouse] = false;
		return mouseState[mouse];
	};
	
	/**
	 * Gets whether or not a mouse button was just pressed.
	 * @param {Number} mouse the button to check against. For a list of buttons, see GenericStar.Input.Mouse.
	 * @returns {Boolean} true if pressed just pressed and not if being held.
	 */
	this.isMouseDownBtn = function(mouse) {
		var ret = mouseBtn[mouse];
		mouseBtn[mouse] = false;
		return ret;
	};
	
	/**
	 * Gets the mouse's current X Position.
	 * @returns {Number} the x position.
	 */
	this.getMouseX = function() {
		return mousePos.x;
	};
	
	/**
	 * Gets the mouse's current Y Position.
	 * @returns {Number} the y position.
	 */
	this.getMouseY = function() {
		return mousePos.y;
	};
	
	/**
	 * Sets this input handler to be listening in for mouse events on a given DOM object.
	 * Note that this method can only be called once, trying to attach to two objects results in a noop.
	 * @param {Node} dom the dom object to attach to.
	 */
	this.attachMouseListener = function(dom) {
		if (attached) return;
		
		dom.onmousemove = function(e) {
			mousePos.x = e.offsetX;
			mousePos.y = e.offsetY;
		};
		
		document.onmousedown = function(e) {
			mouseState[e.which] = true;
			mouseBtn[e.which] = true;
		};
		
		document.onmouseup = function(e) {
			mouseState[e.which] = false;
			mouseBtn[e.which] = false;
		};
		
		attached = true;
	};
};

/**
 * This is a list of mouse buttons you can use with GenericStar.Input methods.
 */
GenericStar.Input.Mouse = {
	left: 1, middle: 2, right: 3
};

/**
 * This is a list of keys you can use with GenericStar.Input methods.
 */
GenericStar.Input.Key = {
	a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74, k: 75, l: 76, m: 77,
	n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84, u: 85, v: 86, w: 87, x: 88, y: 89, z: 90,
	tab: 9, tilde: 192,
	zero: 48, one: 49, two: 50, three: 51, four: 52, five: 53, six: 54, seven: 55, eight: 56, nine: 57,
	minus: 189, plus: 187, backspace: 8,
	leftBrace: 219, rightBrace: 221, pipe: 220,
	colon: 186, quote: 222, enter: 13,
	lessThan: 188, greaterThan: 190, questionMark: 191, shift: 16,
	control: 17, windows: 91, alt: 18, space: 32,
	
	left: 37, up: 38, right: 39, down: 40,
	numpad0: 96, numpad1: 97, numpad2: 98, numpad3: 99, numpad4: 100, numpad5: 101, numpad6: 102,
	numpad7: 103, numpad8: 104, numpad9: 105, numpadMinus: 109, numpadPlus: 107, numpadPeriod: 110,
	numpadDivide: 111, numpadStar: 106,
	insert: 45, del: 46, end: 35, home: 36, pageUp: 33, pageDown: 34,
	
	esc: 27, f1: 112, f2: 113, f3: 114, f4: 115, f5: 116, f6: 117, 
	f7: 118, f8: 119, f9: 120, f10: 121, f11: 122, f12: 123 
};

/**
 * Creates a Sound Handler.
 * @class this class manages sounds, allowing for playback.
 */
GenericStar.Sound = function() {
	var self = this;
	
	/**
	 * Plays a given sound once.
	 * @param {String} url the URL of the sound to play (mp3 or ogg)
	 * @param {Number} [volume=1] the volume of the sound to play from 0 (softest) to 1 (loudest)
	 * @param {Number} [startTime=0] where in the sound to start playing from
	 */
	this.playSound = function(url, volume, startTime) {
		if (volume == undefined) volume = 1;
		if (startTime == undefined) startTime = 0;
		volume = volume < 0 ? 0 : volume > 1 ? 1 : volume;
		
		var sound = document.createElement('audio'); 
		
		sound.addEventListener('canplaythrough',function() {
			sound.currentTime = startTime;
			sound.volume = volume;
			sound.play();
		},false);
		
		sound.addEventListener('ended',function() {
			sound.src = "";
			sound = null;
		},false);
		
		sound.src = url;
		sound.load();
	};
	
	var bgrndMusic = new Array();
	
	/**
	 * Gets the allocated background music from a given URL.
	 * This music object can then be manipulated by calling other methods in this object.
	 * @param {String} url the url to fetch the music from
	 * @returns {Audio} the audio object representing the music, or undefined / null if it is not loaded
	 */
	this.getMusic = function(url) {
		if (bgrndMusic[url] == undefined || bgrndMusic[url] == null) {
			self.createSound(url, function(snd) {
				bgrndMusic[url] = snd;
			});
		}
		
		return bgrndMusic[url];
	};
	
	/**
	 * Creates an HTML5 Audio Object. For memory reasons, it is often
	 * better to use playSound and getBackgroundMusic rather than ever
	 * try to use this method.
	 * @param {String} url the url to download the music from
	 * @param {Function} callback {(Audio):()} this function is called back when the audio is loaded
	 */
	this.createSound = function(url, callback) {
		var sound = document.createElement('audio'); 
		sound.addEventListener('canplaythrough',function() {
			if (callback !== null && callback !== undefined) callback(sound);
		},false);
		
		sound.src = url;
		sound.load();
	};
	
	/**
	 * Plays an Audio Object (from createSound or getMusic).
	 * If the sound is already playing, this method does nothing.
	 * @param {Audio} sound the sound to play.
	 * @param {Boolean} [repeat] if true, repeat the audio. If not set, will not change repeat amount.
	 */
	this.play = function(sound, repeat) {
		if (repeat != undefined && repeat != null) self.setRepeat(sound, repeat);
		sound.play();
	};
	
	/**
	 * Pauses an Audio Object (from createSound or getMusic).
	 * If the sound is already paused, this method does nothing.
	 * @param {Audio} sound the sound to pause
	 */
	this.pause = function(sound) {
		sound.pause();
	};
	
	/**
	 * Stops and Audio Object (from createSound or getMusic).
	 * This is the same as calling pause and setting current time to 0 seconds.
	 * @param {Audio} sound the sound to stop
	 */
	this.stop = function(sound) {
		sound.pause();
		self.setCurrentTime(sound, 0);
	};
	
	/**
	 * Gets whether or not a given sound (from createSound or getMusic) is playing.
	 * @returns {Boolean} true if it is playing, false otherwise
	 */
	this.isPlaying = function(sound) {
		return sound.paused == false;
	};
	
	/**
	 * Sets whether or not this sound will repeat when played.
	 * @param {Audio} sound the sound to set
	 * @param {Boolean} repeat true if we want to repeat
	 */
	this.setRepeat = function(sound, repeat) {
		sound.loop = repeat;
	};
	
	/**
	 * Sets the current playback position in the sound.
	 * @param {Audio} sound a sound object
	 * @param {Number} time the time (in seconds) to jump to
	 */
	this.setCurrentTime = function(sound, time) {
		sound.currentTime = time;
	};
	
	/**
	 * Sets the volume of a given sound.
	 * @param {Audio} sound the sound to set volume of
	 * @param {Number} volume the volume to be from 0 (softest) to 1 (loudest)
	 */
	this.setVolume = function(sound, volume) {
		sound.volume = volume;
	};
};

GenericStar.Physics = new Object();

/**
 * Creates a physics controller.
 * @class This is a wrapper for Box2D, and as such is best for 2D physics simulations.
 * @param {GenericStar.Core} core the core controller of the game
 * @param gravity the gravity vector for this world
 * @param {Number} gravity.x the x component of the gravity for this world
 * @param {Number} gravity.y the y component of the gravity for this world
 */
GenericStar.Physics.Controller = function(core, gravity) {
	var SCALE = 1.0/30.0;
	
	//namespaces
	var b2Vec2 = Box2D.Common.Math.b2Vec2,
	    b2BodyDef = Box2D.Dynamics.b2BodyDef,
 	    b2Body = Box2D.Dynamics.b2Body,
 	    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
 	    b2Fixture = Box2D.Dynamics.b2Fixture,
 	    b2World = Box2D.Dynamics.b2World,
 	    b2MassData = Box2D.Collision.Shapes.b2MassData,
 	    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
 	    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
        b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
        
        b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
        b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef,
        b2PulleyJointDef   = Box2D.Dynamics.Joints.b2PulleyJointDef,
        b2GearJointDef     = Box2D.Dynamics.Joints.b2GearJointDef;
	
	
	var world = new b2World(
            new b2Vec2(gravity.x * SCALE, gravity.y * SCALE)
         ,  true                 //allow sleep
      );
	
	var contactListener = function() {
		this.BeginContact = function(contact) {};
		this.EndContact = function(contact) {};
		this.PreSolve = function(contact, oldManifold) {};
		this.PostSolve = function(contact, impulse) {};
	};
	
	var isCcw = function(p1, p2, p3) {
		return (p2.x - p1.x)*(p3.y - p1.y) - (p2.y - p1.y)*(p3.x - p1.x) > 0;
	};
	
	world.SetContactListener(new contactListener());
	
	/*var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(document.getElementById("debug").getContext("2d"));
	debugDraw.SetDrawScale(30.0);
	debugDraw.SetFillAlpha(0.3);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);*/
	
	this.stepSimulation = function() {
		world.Step(1.0/30, 1, 1);
		world.ClearForces();
		world.DrawDebugData();
	};
	
	var createBody = function(x, y, free, bullet, canRotate, damping, angularDamping) {
		if (bullet == undefined) bullet = false;
		if (canRotate == undefined) canRotate = true;
		
		var bodyDef = new b2BodyDef;
		bodyDef.position.x = x;
        bodyDef.position.y = y;
		if (!free) bodyDef.type = b2Body.b2_staticBody;
		else bodyDef.type = b2Body.b2_dynamicBody;
        if (damping != undefined) bodyDef.linearDamping = damping * SCALE;
        if (angularDamping != undefined) bodyDef.angularDamping = angularDamping * SCALE;
        bodyDef.fixedRotation = !canRotate;
        bodyDef.bullet = bullet;
        var created = world.CreateBody(bodyDef);
        return created;
	};
	
	var setupFixture = function(solid, friction, density, restitution) {
		var fixDef = new b2FixtureDef;
		fixDef.isSensor = !solid;
		fixDef.friction = friction;
        fixDef.density = density;
        fixDef.restitution = restitution;
        return fixDef;
	};
	
	/**
	 * Creates a box physics object
	 * @param {Number} x the x position of the top left of the box
	 * @param {Number} y the y position of the top left of the box
	 * @param {Number} width how wide the box is
	 * @param {Number} height how tall the box is
	 * @param {Boolean} free if true, this object can move, otherwise it will be immobile
	 * @param {Boolean} solid if true, this object will not pass through other solid objects
	 * @param {Boolean} [bullet=false] if true, this object will be more rigerously collision checked, but may slow the game down.
	 * 					Use for objects that are passing through other objects.
	 * @param {Boolean} [canRotate=true] if false, this object cannot rotate
	 * @param {Number} [damping] how much "air resistance" there is (friction to general movement). If undefined, no damping will occur.
	 * @param {Number} [friction=0.5] the coefficient of friction this object has
	 * @param {Number} [density=1.0] the density of this object
	 * @param {Number} [restitution=0.3] the "bounciness" of this object
	 * @returns {GenericStar.Physics.PhysObj} the created physics object
	 */
	this.createBox = function(x, y, width, height, free, solid, bullet, canRotate, damping, friction, density, restitution) {
		if (friction == undefined) friction = 0.5;
		if (density == undefined) density = 1.0;
		if (restitution == undefined) restitution = 0.3;
		width = width * SCALE;
		height = height * SCALE;
		x = x * SCALE + width / 2;
		y = y * SCALE + height / 2;
		
		var created = createBody(x, y, free, bullet, canRotate, damping);
        
        var fixDef = setupFixture(solid, friction, density, restitution);
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(width/2, height/2);
        created.CreateFixture(fixDef);
		
        var boxRet = new GenericStar.Physics.PhysObj(created, this, width, height, true);
		return boxRet;
	};
	
	/**
	 * Creates a circular physics object
	 * @param {Number} x the x position of the center of the circle
	 * @param {Number} y the y position of the center of the circle
	 * @param {Number} radius the radius of the circle
	 * @param {Boolean} free if true, this object can move, otherwise it will be immobile
	 * @param {Boolean} solid if true, this object will not pass through other solid objects
	 * @param {Boolean} [bullet=false] if true, this object will be more rigerously collision checked, but may slow the game down.
	 * 					Use for objects that are passing through other objects.
	 * @param {Boolean} [canRotate=true] if false, this object cannot rotate
	 * @param {Number} [damping] how much "air resistance" there is (friction to general movement). If undefined, no damping will occur.
	 * @param {Number} [friction=0.5] the coefficient of friction this object has
	 * @param {Number} [density=1.0] the density of this object
	 * @param {Number} [restitution=0.3] the "bounciness" of this object
	 * @returns {GenericStar.Physics.PhysObj} the created physics object
	 */
	this.createCircle = function(x, y, radius, free, solid, bullet, canRotate, damping, friction, density, restitution) {
		if (density == undefined) density = 1.0;
		if (friction == undefined) friction = 0.5;
		if (restitution == undefined) restitution = 0.3;
		radius = radius * SCALE;
		x = x * SCALE;
		y = y * SCALE;
		
		var created = createBody(x, y, free, bullet, canRotate, damping);
		
		var fixDef = setupFixture(solid, friction, density, restitution);
        fixDef.shape = new b2CircleShape;
        fixDef.shape.SetRadius(radius);
        created.CreateFixture(fixDef);
        
        return new GenericStar.Physics.PhysObj(created, this, radius*2, radius*2, true);
	};
	
	/**
	 * Creates a polygonal physics object
	 * @param {Number} x the x position of the center of this object
	 * @param {Number} y the y position of the center of this object
	 * @param {Point[][]} triangles List of triangles to defined the solid portion of the
	 * 			polygon. Note that a triangle itself is an array of three points (where a point is an
	 * 			object containing an x and y attribute)
	 * @param {Boolean} free if true, this object can move and observe dynamics, otherwise it is pinned to the scene and cannot move.
	 * @param {Boolean} solid if true, this object will never pass through other solid objects
	 * @param {Boolean} [bullet=false] if true, this object will be more rigerously collision checked, but may slow the game down.
	 * 					Use for objects that are passing through other objects.
	 * @param {Boolean} [canRotate=true] if false, this object cannot rotate
	 * @param {Number} [damping] how much "air resistance" there is (friction to general movement). If undefined, no damping will occur.
	 * @param {Number} [friction=0.5] the coefficient of friction for this object (0.3 generally works)
	 * @param {Number} [density=1.0] the density of this object.
	 * @param {Number} [restitution=0.3] the "bounciness" of this object
	 * @returns {GenericStar.Physics.PhysObj} the physics object created
	 */
	this.createPolygon = function(x, y, triangles, free, solid, bullet, canRotate, damping, friction, density, restitution) {
		if (friction == undefined) friction = 0.5;
		if (density == undefined) density = 1.0;
		if (restitution == undefined) restitution = 0.3;
		x = x * SCALE;
		y = y * SCALE;
		
		var minPt = {x: triangles[0][0].x, y: triangles[0][0].y};
		var maxPt = {x: triangles[0][0].x, y: triangles[0][0].y};
		
		var created = createBody(x, y, free, bullet, canRotate, damping);
        
        for(var i=0; i < triangles.length; i++) {
        	var fixDef = setupFixture(solid, friction, density, restitution);
            fixDef.shape = new b2PolygonShape;
            if (core.DEBUG && triangles[i].length != 3) {
            	console.warn("WARNING physics triangle list malformed at position["+i+"], data:["+triangles+"]");
            	continue;
            }
            var ccw = isCcw(triangles[i][0], triangles[i][1], triangles[i][2]);
            var arr = new Array();
            for(var j=0; j < 3; j++) {
            	var ind = ccw ? j : 2 - j;
            	minPt.x = Math.min(minPt.x, triangles[i][j].x);
            	minPt.y = Math.min(minPt.y, triangles[i][j].y);
            	maxPt.x = Math.max(maxPt.x, triangles[i][j].x);
            	maxPt.y = Math.max(maxPt.y, triangles[i][j].y);
            	arr[ind] = new b2Vec2(triangles[i][j].x * SCALE, triangles[i][j].y * SCALE);
            }
            fixDef.shape.SetAsArray(arr, 3);
            
            created.CreateFixture(fixDef);
        }
		
		return new GenericStar.Physics.PhysObj(created, this, (maxPt.x - minPt.x)*SCALE, (maxPt.y - minPt.y)*SCALE, false);
	};
	
	/**
	 * Pins a distance joint between two physics objects (a distance between two points on
	 * two objects cannot exceed whatever you set).
	 * @param {GenericStar.Physics.PhysObj} phys1 the first physics object to tie together
	 * @param pos1 the position in world-space to tie the first object to
	 * @param {Number} pos1.x the x coordinate of the first position
	 * @param {Number} pos1.y the y coordinate of the first position
	 * @param {GenericStar.Physics.PhysObj} phys2 the second physics object to tie to the first
	 * @param pos2 the position in world-space to tie the second object to
	 * @param {Number} pos2.x the x coordinate of the second position
	 * @param {Number} pos2.y the y coordinate of the second position
	 * @param {Number} dist the distance that these two objects cannot exceed
	 * @param {Boolean} [collide=true] whether or not phys1 interacts with phys2 anymore
	 * @param {Number} [dampeningFrequency] the frequency at which dampening occurs. If undefined, there will be no dampening. 
	 * @param {Number} [dampeningRatio] number in between 0 and 1.0 that corresponds to the dampening ration. If undefined, there will be no dampening.
	 * @returns {GenericStar.Physics.Joint} the joint that was created.
	 */
	this.pinDistanceJoint = function(phys1, pos1, phys2, pos2, dist, collide, dampeningFrequency, dampeningRatio) {
		var jointDef = new b2DistanceJointDef;
		var worldPos1 = phys1._body.GetWorldPoint(new b2Vec2(0,0));
		var worldPos2 = phys2._body.GetWorldPoint(new b2Vec2(0,0));
		
		if (pos1 == undefined) pos1 = {x: worldPos1.x/SCALE, y: worldPos1.y/SCALE};
		if (pos2 == undefined) pos2 = {x: worldPos2.x/SCALE, y: worldPos2.y/SCALE};
		if (collide == undefined) collide = true;
		
		jointDef.Initialize(phys1._body, phys2._body, 
				new b2Vec2(pos1.x*SCALE, pos1.y*SCALE),
				new b2Vec2(pos2.x*SCALE, pos2.y*SCALE));
		
		jointDef.length = dist * SCALE;
		jointDef.collideConnected = collide;
		if (dampeningFrequency != undefined && dampeningRatio != undefined) {
			jointDef.frequencyHz = dampeningFrequency;
			jointDef.dampingRatio = dampeningRatio;
		}
		
		var joint = world.CreateJoint(jointDef);
		return new GenericStar.Physics.Joint(joint, false, false);
	};
	
	/**
	 * Pins a revolute joint between two physics object.
	 * @param {GenericStar.Physics.PhysObj} phys1 the second object to pin
	 * @param {GenericStar.Physics.PhysObj} phys2 the second object to pin
	 * @param pos the location in world-coordinates to pin both objects to
	 * @param {Number} pos.x the x component of the object pinning position
	 * @param {Number} pos.y the y component of the object pinning position
	 * @param [angleConstraints] angles the joint must stay within. If not included, default is no restrictions.
	 * @param {Number} [angleConstraints.min] minimum angle the joint can have (in degrees)
	 * @param {Number} [angleConstraints.max] maximum angle the joint can have (in degrees)
	 * @param {Number} [maxMotorTorque] the maximum torque the motor powering the joint will have.
	 * 			If it is undefined, this joint will not have a motor.
	 * @returns {GenericStar.Physics.Joint} the joint that was created.
	 */
	this.pinRevoluteJoint = function(phys1, phys2, pos, angleConstraints, maxMotorTorque) {
		var jointDef = new b2RevoluteJointDef;
		jointDef.Initialize(phys1._body, phys2._body, new b2Vec2(pos.x*SCALE, pos.y*SCALE));
		
		if (angleConstraints != undefined && angleConstraints.min != undefined && angleConstraints.max != undefined) {
			jointDef.lowerAngle = angleConstraints.min * Math.PI / 180;
			jointDef.upperAngle = angleConstraints.max * Math.PI / 180;
			jointDef.enableLimit = true;
		}
		
		if (maxMotorTorque != undefined && maxMotorTorque != null) {
			jointDef.maxMotorTorque = maxMotorTorque;
			jointDef.motorSpeed = 0.0;
			jointDef.enableMotor = true;
		} else {
			jointDef.enableMotor = false;
		}
		
		var joint = world.CreateJoint(jointDef);
		
		return new GenericStar.Physics.Joint(joint, jointDef.enableMotor, true);
	};
	
	/**
	 * Creates a pully joint between two objects (simulates two objects attached to
	 * a pully system).
	 * @param {GenericStar.Physics.PhysObj} phys1 the first object to attach to the pully
	 * @param pullyTopPos1 the location in world-coordinates of the top of the pully attached to phys1
	 * @param {Number} pullyTopPos1.x the x component of the first pulley top
	 * @param {Number} pullyTopPos1.y the y component of the first pulley top
	 * @param attachPos1 the location in world-coordinates of where the string is attached to phys1 (point should be on phys1)
	 * @param {Number} attachPos1.x the x component of the first pulley attach position
	 * @param {Number} attachPos1.y the y component of the first pulley attach position
	 * @param {GenericStar.Physics.PhysObj} phys2 the second object to attach to the pully
	 * @param pullyTopPos2 the location in world-coordinates of the top of the pully attached to phys2
	 * @param {Number} pullyTopPos2.x the x component of the second pulley top
	 * @param {Number} pullyTopPos2.y the y component of the second pulley top
	 * @param attachPos2 the location in world-coordinates of where the string is attached to phys2 (point should be on phys2)
	 * @param {Number} attachPos2.x the x component of the second pulley attach position
	 * @param {Number} attachPos2.y the y component of the second pulley attach position
	 * @param [maxLength1] the maximum distance that the pulley attached to phys1 can reach
	 * @param [maxLength2] the maximum distance that the pulley attached to phys2 can reach
	 * @param [ratio=1] the ratio of lengths the pully can achieve
	 * @returns {GenericStar.Physics.Joint} the joint that was created.
	 */
	this.pinPulleyJoint = function(phys1, pullyTopPos1, attachPos1, phys2, pullyTopPos2, attachPos2, maxLength1, maxLength2, ratio) {
		var anchor1 = new b2Vec2(pullyTopPos1.x * SCALE, pullyTopPos1.y * SCALE);
		var anchor2 = new b2Vec2(pullyTopPos2.x * SCALE, pullyTopPos2.y * SCALE);
		var pos1 = new b2Vec2(attachPos1.x * SCALE, attachPos1.y * SCALE);
		var pos2 = new b2Vec2(attachPos2.x * SCALE, attachPos2.y * SCALE);
		var maxLength = Math.sqrt(Math.pow(pos1.x - anchor1.x, 2) + Math.pow(pos1.y - anchor1.y, 2)) +
						Math.sqrt(Math.pow(pos2.x - anchor2.x, 2) + Math.pow(pos2.y - anchor2.y, 2)) - (1*SCALE);
		
		if (maxLength1 == undefined) maxLength1 = maxLength;
		else maxLength1 *= SCALE;
		maxLength1 = Math.min(maxLength1, maxLength);
		
		if (maxLength2 == undefined) maxLength2 = maxLength;
		else maxLength2 *= SCALE;
		maxLength2 = Math.min(maxLength2, maxLength);
		
		if (ratio == undefined) ratio = 1.0;

		var jointDef = new b2PulleyJointDef;

		jointDef.Initialize(phys1._body, phys2._body, anchor1, anchor2, pos1, pos2, ratio);
		jointDef.maxLengthA = maxLength1;
		jointDef.maxLengthB = maxLength2;
		
		var joint = world.CreateJoint(jointDef);
		return new GenericStar.Physics.Joint(joint, false, false);
	};
	
	/**
	 * Pins a gear joint between two revolute joints (makes them locked to each
	 * other's angle, times a given ratio).
	 * @param {GenericStar.Physics.PhysObj} phys the first object attached to the first revolute joint
	 * @param {GenericStar.Physics.Joint} joint1 the first revolute joint
	 * @param {GenericStar.Physics.PhysObj} phys2 the second object attached to the second revolute joint
	 * @param {GenericStar.Physics.Joint} joint2 the second revolute joint
	 * @param {Number} ratio the number to multiply the first joint's angle by to get the second joint's angle
	 * @returns {GenericStar.Physics.Joint} the joint that was created, or null if either joint was not a revolute joint
	 */
	this.pinGearJoint = function(phys, joint1, phys2, joint2, ratio) {
		if (!joint1._gear || !joint2._gear) return null;
		
		var jointDef = new b2GearJointDef;
		jointDef.joint1 = joint1._joint;
		jointDef.joint2 = joint2._joint;
		jointDef.bodyA = phys._body;
		jointDef.bodyB = phys2._body;
		jointDef.ratio = ratio;
		
		var joint = world.CreateJoint(jointDef);
		return new GenericStar.Physics.Joint(joint, false, false);
	};
	
	/**
	 * Creates a player physics object for a 2D Platformer.
	 * @param {Number} x the x-coordinate the player starts at
	 * @param {Number} y the y-coordinate the player starts at
	 * @param {Number} w the width of the player. Note that it must be the case that width <= height.
	 * @param {Number} h the height of the player. Note that it must be the case that height >= width.
	 * @param [maxspeed] the maximum speed this player can travel at before being capped.
 	 * @param {Number} maxspeed.x x component of the maximum speed at which the player can travel
 	 * @param {Number} maxspeed.y y component of the maximum speed at which the player can travelmaxspeed
 	 * @param {Number} [airTravelFactor] the factor multiplied into walking speed while the player is in the air
	 * @param {Number} [wallStick] the number of steps the player needs to hold the move key before unsticking from a wall
	 * @param {Boolean} [wallAlign] if true, a player will not bounce off of walls
	 * @param {Number} [wallReduce] the factor by which we reduce falling maxspeed while sliding down a wall
	 * @param {Number} [jumpTime] the number of steps by which the player can extend the jump
	 * @returns {GenericStar.Physics.Player} the created player object
	 */
	this.createPlayer = function(x, y, w, h, maxspeed, airTravelFactor, wallStick, wallAlign, wallReduce, jumpTime) {
		if (w > h) {
			if (core.DEBUG) console.error("Assertion[Player Width <= Height] Failed!");
			w = h;
		}
		
		if (maxspeed == undefined) maxspeed = {x:20 / SCALE, y:20 / SCALE};
		if (airTravelFactor == undefined) airTravelFactor = 1;
		if (wallStick == undefined) wallStick = 0;
		if (wallAlign == undefined) wallAlign = true;
		if (wallReduce == undefined) wallReduce = 1;
		if (jumpTime == undefined) jumpTime = 4;
		
		wallReduce = Math.min(1.0, Math.max(0, wallReduce));
		
		var friction = 1;
		var density = 0.1;
		var restitution = 0.01;
		x = x * SCALE;
		y = y * SCALE;
		
		//create rectangle
		var rectWidth = w * SCALE;
		var rectHeight= h * SCALE - rectWidth/2;
		var bodyRect = createBody(x + rectWidth/2, y + rectHeight/2, true, true, false, 0, 6);
        
        var fixDef = setupFixture(true, 0, density, restitution);
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(rectWidth/2, rectHeight/2);
        var fixRect = bodyRect.CreateFixture(fixDef);
        var fixRect = null;
		
		//create wheel
		var radius = w * SCALE / 2;
		var fixDef = setupFixture(true, friction, density, restitution);
        fixDef.shape = new b2CircleShape;
        fixDef.shape.SetRadius(radius);
        fixDef.shape.SetLocalPosition(new b2Vec2(0, rectHeight/2));
        var fixCircle = bodyRect.CreateFixture(fixDef);
        
        return new GenericStar.Physics.Player(bodyRect, fixRect, fixCircle, this, w*SCALE, h*SCALE, 
        		{x: maxspeed.x * SCALE, y: maxspeed.y * SCALE},
        		airTravelFactor, wallStick, !!wallAlign, wallReduce, jumpTime);
	};
	
	/**
	 * Gets the scale this physics simulation is running at.
	 * Used internally by other library objects, not useful externally.
	 * @returns {Number} the scale of the simulation
	 */
	this.getScale = function() {
		return SCALE;
	};
	
	/**
	 * Gets the world used by this physics model.
	 * Used interally, do not use in your code.
	 * @returns {Box2D.Dynamics.b2World} the Box2D world
	 */
	this.getWorld = function() {
		return world;
	};
};

/**
 * Creates a Physics Object.
 * @class This object is used for carrying state about a physics body. 
 * 			Simply pass it into GenericStar.Physics.Controller methods to manipulate
 * 			it, do not attempt to modify its data manually.
 * @param {Box2D.Dynamics.b2Body} body the physics body
 * @param {GenericStar.Physics.Controller} phys the physics controller this object is attached to
 * @param {Number} w the width as set by the user
 * @param {Number} h the height as set by the user
 * @param {Boolean} box whether or not this was created as a box (effects position)
 */
GenericStar.Physics.PhysObj = function(body, phys, w, h, box) {
	this._body = body;
	this._phys = phys;
	this._w = w;
	this._h = h;
	this._box = box;
};

GenericStar.Physics.PhysObj.prototype = {
	//namespaces
	b2Vec2: Box2D.Common.Math.b2Vec2,
	
	/**
	 * Gets the x position this physics object is currently at.
	 * @returns {Number} the x position
	 */
	getDrawX: function() {
		return this._body.GetPosition().x / this._phys.getScale();
	},

	/**
	 * Gets the y position this physics object is currently at.
	 * @returns {Number} the y position
	 */
	getDrawY: function() {
		return this._body.GetPosition().y / this._phys.getScale();
	},
	
	/**
	 * Gets the x coordinate of the centroid of this object
	 * @returns {Number} the x position of the centroid
	 */
	getCentroidX: function() {
		return this._body.GetWorldCenter().x / this._phys.getScale();
	},
	
	/**
	 * Gets the y coordinate of the centroid of this object
	 * @returns {Number} the y position of the centroid
	 */
	getCentroidY: function() {
		return this._body.GetWorldCenter().y / this._phys.getScale();
	},
	
	/**
	 * Sets the angle at which this physics object is rotated.
	 * @param {Number} angle the angle to rotate to (in degrees)
	 * @param {Boolean} relative if true, only add this angle to the current angle
	 */
	setAngle: function(angle, relative) {
		if (relative != undefined && relative) angle = angle + this.getAngle();
		this._body.SetAngle((-angle + 360)/180 * Math.PI);
	},
	
	/**
	 * Gets the angle at which this physics object is rotated.
	 * @returns {Number} the angle (in degrees)
	 */
	getAngle: function() {
		return 360 - this._body.GetAngle() * 180 / Math.PI;
	},
	
	/**
	 * Gets the draw-width of this physics object
	 * @returns {Number} the width (in pixels)
	 */
	getWidth: function() {
		return this._w / this._phys.getScale();
	},
	
	/**
	 * Gets the draw-height of this physics object
	 * @returns {Number} the height (in pixels)
	 */
	getHeight: function() {
		return this._h / this._phys.getScale();
	},
	
	/**
	 * Gets the position to set the center at for drawing.
	 * @returns {Number} the x position that the center should be set to
	 */
	getDrawCenterX: function() {
		return this._box? this.getWidth()/2 : 0;
	},
	
	/**
	 * Gets the position to set the center at for drawing.
	 * @returns {Number} the y position that the center should be set to
	 */
	getDrawCenterY: function() {
		return this._box? this.getHeight()/2 : 0;
	},
	
	/**
	 * Applies a force to a given physics object.
	 * @param {Number} forceX the x component of the force to apply
	 * @param {Number} forceY the y component of the force to apply
	 * @param {Number} [pX] the x coordinate of the position to apply the force to in world coordinates.
	 * 			If undefined, it will use the centroid position.
	 * @param {Number} [pY] the y coordinate of the position to apply the force to in world coordinates.
	 * 			If undefined, it will use the centroid position.
	 */
	applyForce: function(forceX, forceY, pX, pY) {
		var SCALE = this._phys.getScale();
		if (pX != undefined) pX *= SCALE;
		if (pY != undefined) pY *= SCALE;
		if (pX == undefined || pY == undefined) {
			if (pX == undefined) pX = this._body.GetWorldCenter().x;
			if (pY == undefined) pY = this._body.GetWorldCenter().y;
		}
		
		this._body.ApplyForce(new this.b2Vec2(forceX*SCALE, forceY*SCALE), new this.b2Vec2(pX, pY));
	},
	
	/**
	 * Applies a force in a direction.
	 * @param {Number} force the strength of the force 
	 * @param {Number} direction the direction (in degrees)
	 * @param {Number} [pX] the x coordinate to apply the force to in world coordinates
	 * @param {Number} [pY] the y coordinate to apply the force to in world coordinates
	 */
	applyDirectionalForce: function(force, direction, pX, pY) {
		this.applyForce(
				force * Math.cos(-direction / 180 * Math.PI), 
				force * Math.sin(-direction / 180 * Math.PI), pX, pY);
	},
	
	/**
	 * Sets the velocity of a given physics object.
	 * @param {Number} x the x component of the velocity to set
	 * @param {Number} y the y component of the velocity to set
	 */
	setVelocity: function(x, y) {
		var SCALE = this._phys.getScale();
		this._body.SetLinearVelocity(new this.b2Vec2(x*SCALE, y*SCALE));
	},
	
	/**
	 * Moves a given physics object to a given position.
	 * @param {Number} x the new draw position to set the object to
	 * @param {Number} y the new draw position to set the object to
	 * @param {Boolean} [relative=false] whether or not to set the position relative to the old position
	 */
	setCenterPosition: function(x, y, relative) {
		if (relative == undefined) relative = false;
		var SCALE = this._phys.getScale();
		this._body.SetPosition(new this.b2Vec2(
				(relative? this._body.GetPosition().x : 0) + x*SCALE,
				(relative? this._body.GetPosition().y : 0) + y*SCALE));
		this._body.SetAwake(true);
	},
	
	/**
	 * Removes this object from a given physics world that it is in.
	 * @param {GenericStar.Physics.Controller} phys the physics handler this object is in
	 */
	destroy: function(phys) {
		this._phys.getWorld().DestroyBody(this._body);
	}
};

/**
 * Creates a common 2D platformer player physics model.
 * @class A common 2D Physical model of a platformer player using the box and wheel model.
 * @param {Box2D.Dynamics.b2Body} bodyTop the body of the rectangle
 * @param {Box2D.Dynamics.b2Fixture} fixTop the fixture of the rectangle (used for collisions)
 * @param {Box2D.Dynamics.b2Fixture} fixTop the fixture of the wheel (used for collisions)
 * @param {GenericStar.Physics.Controller} the physics world object this is within
 * @param {Number} w the width of the player
 * @param {Number} h the height of the player
 * @param maxspeed the maximum speed this player can travel at before being capped.
 * @param {Number} maxspeed.x x component of the maximum speed at which the player can travel
 * @param {Number} maxspeed.y y component of the maximum speed at which the player can travelmaxspeed
 * @param {Number} airTravelFactor the factor multiplied into walking speed while the player is in the air
 * @param {Number} wallStick the number of steps of holding a direction before a player can unstick from a wall
 * @param {Boolean} wallAlign whether or not to align or bounce off of walls.
 * @param {Number} wallSlideReduction the amount to slow falling by when sliding down a wall
 * @param {Number} jumpTime the amount of time (in steps) that the player can use to extend a jump
 */
GenericStar.Physics.Player = function(bodyTop, fixTop, fixWheel, phys, w, h, 
		maxspeed, airTravelFactor, wallStick, wallAlign, wallSlideReduction, jumpTime) {
	this._body = bodyTop;
	this._fixTop = fixTop;
	this._fixBot = fixWheel;
	this._phys = phys;
	this._w = w;
	this._h = h;
	this._box = true;
	
	this._wallUnstick = 0;
	this._prevWalk = 0;
	
	this._airTravelFactor = airTravelFactor;
	this._wallMagnetism = (wallAlign ? 10 : 0);
	this._wallStick = wallStick;
	this._wallReduce = wallSlideReduction;
	this._maxSpeed = maxspeed;
	
	this._prevJump = false;
	this._jumpTime = 0;
	this._maxJumpTime = jumpTime;
	
	this._wallToLeft = false;
	this._wallToRight= false;
	this._onGround = false;
	
	this._vecRight = {x: -1, y:  0};
	this._vecUp    = {x:  0, y: -1};
	this.setAngle(0, false);
};
GenericStar.Physics.Player.prototype = new GenericStar.Physics.PhysObj();

/**
 * Gets the position to set the center at for drawing.
 * @returns {Number} the x position that the center should be set to
 */
GenericStar.Physics.Player.prototype.getDrawCenterX = function() {
	return this.getWidth()/2;
};

/**
 * Gets the position to set the center at for drawing.
 * @returns {Number} the y position that the center should be set to
 */
GenericStar.Physics.Player.prototype.getDrawCenterY = function() {
	return this.getHeight()/2 - this.getWidth()/4;
};

/**
 * Sets the angle at which this player is rotated.
 * @param {Number} angle the angle to rotate to (in degrees)
 * @param {Boolean} relative if true, only add this angle to the current angle
 */
GenericStar.Physics.Player.prototype.setAngle = function(angle, relative) {
	if (relative != undefined && relative) angle = angle + this.getAngle();
	
	this._body.SetAngle((-angle + 360)/180 * Math.PI);
	var radAngle = -angle / 180 * Math.PI;
	this._vecRight.x = Math.cos(radAngle);
	this._vecRight.y = Math.sin(radAngle);
	radAngle -= Math.PI / 2;
	this._vecUp.x = Math.cos(radAngle);
	this._vecUp.y = Math.sin(radAngle);
};

GenericStar.Physics.Player.prototype.MAX_WALL_ANGLE = 0.1;
GenericStar.Physics.Player.prototype.MAX_GROUND_ANGLE = 0.4;

/**
 * Gets whether or not the player is currently touching the ground
 * @returns {Boolean} true if the player is on the ground
 */
GenericStar.Physics.Player.prototype.isOnGround = function() {
	return this._onGround;
};

/**
 * Gets whether or not the player is in contact with a wall to his left.
 * @returns {Boolean} true if there's a wall to his left
 */
GenericStar.Physics.Player.prototype.isWallToLeft = function() {
	return this._wallToLeft;
};

/**
 * Gets whether or not the player is in contact with a wall to his right.
 * @returns {Boolean} true if there's a wall to his right
 */
GenericStar.Physics.Player.prototype.isWallToRight = function() {
	return this._wallToRight;
};

/**
 * Makes the character jump. Note that this will make the character jump whether or not there
 * is ground under its feet - that check must be done manually.
 * @param {Number} dY the amount of force to apply vertically. Should be positive.
 * @param {Number} [dX] the amount of force to apply horizontally. Not required, useful for wall jumps.
 * @param {Boolean} [reset] if true, start a fresh jump now instead of making this function just extend the current jump
 */
GenericStar.Physics.Player.prototype.jump = function(dY, dX, reset) {
	//reset jump physics
	if (reset != undefined && reset) {this._jumpTime = 0;}
	this._prevJump = true;
	if (this._jumpTime == 0) { //zero out the vertical velocity (keep x component)
		this._body.m_linearVelocity.x = this._body.m_linearVelocity.x * this._vecRight.x;
		this._body.m_linearVelocity.y = this._body.m_linearVelocity.y * this._vecRight.y;
	}
	
	if (this._jumpTime > this._maxJumpTime) return;
	
	this._body.ApplyForce(new this.b2Vec2(this._vecUp.x * dY * this._phys.getScale(),
											this._vecUp.y * dY * this._phys.getScale()),
							this._body.GetWorldCenter());
	
	//apply horizontal forces (in x component)
	if (dX != undefined && dX != 0) {
		dX /= this._maxJumpTime;
		this._body.ApplyImpulse(new this.b2Vec2(dX * this._vecRight.x * this._phys.getScale(),
												dX * this._vecRight.x * this._phys.getScale()),
								this._body.GetWorldCenter());
	}
	
	this._jumpTime++;
};

/**
 * Makes the player walk to the left or right.
 * Walking can be affected by being in the air or being stuck on a wall,
 * so this has no guarantee of actually moving the player.
 * @param {Number} dX speed at which to walk. If negative, walk left. If positive, walk right.
 * @param {Boolean} [instantaneous=true] if true, the player can turn around instantly.
 * 			Otherwise, the player must slow down before turning around.
 */
GenericStar.Physics.Player.prototype.walk = function(dX, instantaneous) {
	if (dX == 0) {
		this._prevWalk = 0;
		return;
	}
	if (instantaneous == undefined) instantaneous = true;
	this._prevWalk = dX > 0 ? 1 : dX < 0 ? -1 : 0;
	
	var air = this._onGround ? 1 : this._airTravelFactor;
	
	if ((this._wallToLeft  && this._wallUnstick >  this._wallStick) ||
		(this._wallToRight && this._wallUnstick < -this._wallStick) || 
		(!this._wallToLeft && !this._wallToRight) ||
		this._onGround) {
		
		
		if (instantaneous) {
			this._body.m_linearVelocity.x =
				this._vecRight.x * dX * this._phys.getScale() * air + this._body.m_linearVelocity.x * Math.abs(this._vecUp.x);
			this._body.m_linearVelocity.y =
				this._vecRight.y * dX * this._phys.getScale() * air + this._body.m_linearVelocity.y * Math.abs(this._vecUp.y);
		} else {
			this._body.ApplyForce(new this.b2Vec2(
					this._vecRight.x * dX * this._phys.getScale() * air,
					this._vecRight.y * dX * this._phys.getScale() * air),
				  this._body.GetWorldCenter());
		}
	}
};

GenericStar.Physics.Player.prototype.step = function(print) {
	//this._body.m_sweep.a = 0;//This is what stops the player from rotating. That or magic.
	
	if  (this._prevJump == false) this._jumpTime = 0;
	
	var stepDotWithin = function(x, y, neg, variance) {
		var dot = neg * x.x * y.x + neg * x.y * y.y;
		return dot > 1 - variance && dot < 1 + variance;
	};
	
	//calculate player state
	var prevState = this._state;
	var cl = this._body.GetContactList();
	this._wallToLeft = false;
	this._wallToRight = false;
	this._onGround = false;
	for(var i=0, listMax=100; cl != null && i < listMax; i++, cl = cl.next) {
		if (cl.contact.IsTouching() && !cl.contact.IsSensor()) {
			var manifold = new Box2D.Collision.b2WorldManifold;
			cl.contact.GetWorldManifold(manifold);
			var norm = {x: manifold.m_normal.x, y: manifold.m_normal.y};
			if (cl.contact.GetFixtureB() == this._fixBot || cl.contact.GetFixtureB() == this._fixTop) {
				norm.x *= -1;
				norm.y *= -1;
			}
			this._wallToLeft = this._wallToLeft  || stepDotWithin(norm, this._vecRight,-1, this.MAX_WALL_ANGLE);
			this._wallToRight= this._wallToRight || stepDotWithin(norm, this._vecRight, 1, this.MAX_WALL_ANGLE);
			this._onGround   = this._onGround    || stepDotWithin(norm, this._vecUp,   -1, this.MAX_GROUND_ANGLE);
		}
	}
	
	//if (print) console.log(this._wallToLeft+", "+this._wallToRight+", "+this._onGround);
	
	//align (magnet) to walls
	var effectiveTopspeedVert = 1;
	if (this._wallMagnetism > 0 && (this._wallToLeft || this._wallToRight) && !this._onGround) {
		
		if (this._wallToLeft && this._wallUnstick < this._wallStick) {
			this._body.ApplyForce(new this.b2Vec2(
					this._wallMagnetism * -this._vecRight.x,
					this._wallMagnetism * -this._vecRight.y),
				this._body.GetWorldCenter());
			
		} else if (this._wallToRight && this._wallUnstick > -this._wallStick) {
			this._body.ApplyForce(new this.b2Vec2(
					this._wallMagnetism * this._vecRight.x,
					this._wallMagnetism * this._vecRight.y),
				this._body.GetWorldCenter());
		}
		
		effectiveTopspeedVert = this._wallReduce;
	}
	
	//sticky walls
	if (this._prevWalk < 0 && this._wallUnstick > 0) this._wallUnstick = 0;
	if (this._prevWalk > 0 && this._wallUnstick < 0) this._wallUnstick = 0;
	this._wallUnstick += this._prevWalk;
	this._prevWalk = 0;
	
	//cap topspeed
	var linVel = {x: this._body.m_linearVelocity.x, y: this._body.m_linearVelocity.y};
	var speedX = linVel.x * this._vecRight.x + linVel.y * this._vecRight.y;
	var speedY =-linVel.x * this._vecUp.x    - linVel.y * this._vecUp.y;
	speedX = Math.max(-this._maxSpeed.x, Math.min(this._maxSpeed.x, speedX));
	var yComp = {
		x: linVel.x * Math.abs(this._vecUp.x),
		y: linVel.y * Math.abs(this._vecUp.y)
	};
	var yCompMag = Math.sqrt(yComp.x * yComp.x + yComp.y * yComp.y);
	yComp.x /= yCompMag;
	yComp.y /= yCompMag;
	if (stepDotWithin(yComp, this._vecUp, 1, 0.1)) {
		speedY = Math.max(-this._maxSpeed.y, Math.min(this._maxSpeed.y, speedY));
	} else {
		speedY = Math.max(-this._maxSpeed.y * effectiveTopspeedVert,
				 Math.min( this._maxSpeed.y * effectiveTopspeedVert, speedY));
	}
	
	this._body.m_linearVelocity.x = speedX * this._vecRight.x - speedY * this._vecUp.x;
	this._body.m_linearVelocity.y = speedX * this._vecRight.y - speedY * this._vecUp.y;
	
	this._prevJump = false;
};

/**
 * Creates a physics joint.
 * @class This class represents a joint, which binds one or more objects together. 
 * @param {Mixed} joint the joint definition
 * @param {Boolean} motor whether or not this joint has access to SetMotorSpeed
 * @param {Boolean} gearCapable whether or not this joint can be put into a gear joint
 * @param {GenericStar.Physics.Controller} phys the physics controller that this is within
 */
GenericStar.Physics.Joint = function(joint, motor, gearCapable, phys) {
	this._joint = joint;
	this._enableMotor = motor;
	this._gear = gearCapable;
	this._phys = phys;
};

GenericStar.Physics.Joint.prototype = {
	/**
	 * Sets the constriction speed of this joint.
	 * Only works for certain kinds of joints.
	 * @param {Number} speed the speed to set the motor to
	 */
	setMotorSpeed: function(speed) {
		if (this._enablemotor == false) return;
		this._joint.SetMotorSpeed(speed);
	},
	
	/**
	 * Removes this joint from the physics world.
	 */
	destroy: function() {
		this._phys.getWorld().DestroyJoint(this._joint);
	}
};

/**
 * Creates a new GenericStar Instance. This should not be done except
 * by pre-generated code.
 * @class This class is the prototype of all in-game objects. It handles
 * setting up options passed in by the Generic Construction process and
 * creating them in the "this" object.
 */
GenericStar.Instance = function() {};

/**
 * Initializes this object. Used in the last line of generated code.
 * @param {Object} opts the options to incorporate into this.
 */
GenericStar.Instance.prototype.init = function(opts) {
	for(var opt in opts) this[opt] = opts[opt];
};