/**
 * Creates a $$OBJECT_NAME$$.
 * @class A custom class based off of the Player Generic. Insert your description here!
 * @param {GenericStar.Core} core the core responsible for running this game
 * @param {Object} opts a list of optional options to be applied to this object
 */
$$GAME_NAME$$.$$OBJECT_NAME$$ = function(core, opts) {
	for(var option in opts) this[option] = opts[option]; //copy options into this object, do not remove
};
//The next line is necessary to make this object work within Generic Star.
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype = new GenericStar.Instance();

/**
 * Whenever the object is recycled, this method is called.
 * @param {GenericStar.Core} core the core object maintaining the game
 */
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype.destructor = function(core) {
};

/**
 * This is called once per frame of the game.
 * @param {GenericStar.Core} core the core running the game
 */
$$GAME_NAME$$.$$OBJECT_NAME$$.prototype.draw = function(core) {
};