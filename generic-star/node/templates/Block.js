/**
 * Creates a $$OBJECT_NAME$$.
 * @class A custom class based off of the Block Generic. Insert your description here!
 * @param {GenericStar.Core} core the core responsible for running this game
 * @param {Object} opts a list of optional options to be applied to this object
 */
$$GAME_NAME$$.$$OBJECT_NAME$$ = function(core, opts) {
	for(var option in opts) this[option] = opts[option]; //copy options into this object, do not remove
	
	var self = this;
	this.GRAVITY = 500;
	
	this.box = core.physics.createBox(this.x - this.width/2, this.y - this.height/2, this.width, this.height, this.free === 1, true, false);
	this.box.setAngle(this.rotation, false);
	
	this.mySprite = null;
	if (this.spr !== null && this.spr !== undefined && this.spr.url !== undefined) {
		core.graphics.getPlugin().loadImage('images/'+self.spr.url, function(tex) {
			self.mySprite = tex;
		}, false);
	}
};
//The next line is necessary to make this object work within Generic Star.
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype = new GenericStar.Instance();

/**
 * Whenever the object is recycled, this method is called.
 * @param {GenericStar.Core} core the core object maintaining the game
 */
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype.destructor = function(core) {
	this.box.destroy();
};

/**
 * This is called once per frame of the game.
 * @param {GenericStar.Core} core the core running the game
 */
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype.draw = function(core) {
	var box = this.box;
	//if there is no gravity, apply some!
	if (!core.isUsingGravity()) {
		box.applyForce(0, box._body.GetMass() * this.GRAVITY);
	}
	
	//make sure the sprite has loaded before drawing!
	if (this.mySprite !== null) {
		core.graphics.getPlugin().drawSprite(this.mySprite, 
				box.getDrawX(), box.getDrawY(),
				box.getWidth(), box.getHeight(),
				box.getAngle(),
				box.getDrawCenterX(), box.getDrawCenterY());
	}
};