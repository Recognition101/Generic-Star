window.onload = function() {
	var domGfx = document.getElementById("testCanvasID");
	var core = new GenericStar.Core(domGfx, true, {x:0, y:0});
	
	var keyList = GenericStar.Input.Key;
	var setup = false;
	var sprite = null;
	var sprite2 = null;
	var sprite3 = null;
	
	var rot = 0;
	var index = 0;
	var fishPos = {x: 0, y: 300};
	var fishCol = 1;
	var selfInput = core.input;
	var soundController = core.sound;
	var sfx = null;
	var music = null;
	var physics = core.physics;
	var objs = new Array();
	var sensor= physics.createBox(200, 0, 50, 50, true, false);
	var friction = 1;
	var GRAVITY = 500;
	
	var physFloor = physics.createBox(0, 380, 640, 100, false, true, false, false, undefined, friction, 1.0, 0.1);
	var physFloor2 = physics.createBox(-100, 0, 100, 480, false, true, false, false, undefined, friction, 1.0, 0.1);
	var physFloor3 = physics.createBox(640, 0, 100, 480, false, true, false, false, undefined, friction, 1.0, 0.1);
	//objs.push(physics.createPolygon(225, 100, [[{x:0, y:0},  {x:0, y:150}, {x:150, y:0}]], true, true, false, true, undefined, 6, 1.0, 0.1));
	
	//dist joint
	var dj1 = physics.createPolygon(300, 0, [[{x:0, y:0},  {x:0, y:50}, {x:50, y:0}]], false, true);
	var dj2 = physics.createPolygon(300, 75, [[{x:0, y:0},  {x:0, y:50}, {x:50, y:0}]], true, true);
	var dj = physics.pinDistanceJoint(dj1, {x:300, y:0}, dj2, {x:300, y:75}, 75, false, 4.0, 0.3);
	objs.push(dj1);
	objs.push(dj2);
	
	//pully joint
	var pj1 = physics.createBox(50, 0, 50, 50, true, true);
	var pj2 = physics.createPolygon(120, 200, [[{x:0, y:0},  {x:0, y:50}, {x:50, y:0}]], true, true);
	var pj = physics.pinPulleyJoint(pj1, {x: 50, y: 0}, {x: 50, y:0}, pj2, {x: 120, y:0}, {x:120, y:200});
	objs.push(pj1);
	objs.push(pj2);
	
	//gear joint
	var rj1 = physics.createBox(400, 100, 100, 50, false, true);
	var rj2 = physics.createCircle(500, 150, 25, true, true);
	var rj3 = physics.createCircle(400, 150, 25, true, true);
	var rjj1 = physics.pinRevoluteJoint(rj1, rj2, {x:500, y:150});
	var rjj2 = physics.pinRevoluteJoint(rj1, rj3, {x:400, y:150});
	physics.pinGearJoint(rj2, rjj1, rj3, rjj2, 1.0);
	objs.push(rj1);
	objs.push(rj2);
	objs.push(rj3);
	objs.push(physics.createBox(510, 10, 50, 50, true, true));
	
	//player
	var playerDir = 270;
	var player = physics.createPlayer(200, 100, 30, 70, {x:600, y:600}, 0.9, 10, true, 0.2);
	player.setAngle(playerDir + 90, false);
	
	
	core.start(function(gfx) {
		//load sprites
		if (!setup) {
			gfx.loadImage('arrow-tex-1.gif', function(tex) {
				sprite = tex;
			}, true);
			gfx.loadImage('arrow-tex-2.gif', function(tex) {
				sprite3 = tex;
			}, true);
			gfx.loadImage('fishstrip.png', function(tex) {
				sprite2 = tex;
			});
			
			setup = true;
		}
		
		//check that sprites are loaded
		if (sprite != null && sprite2 != null) {
			//input testing
			if (selfInput.isKeyDownBtn(keyList.leftBrace)) {
				fishCol = (fishCol + 1) % 3;
			}
			
			if (selfInput.isKeyDown(keyList.right)) {
				if (fishPos.x < 640) fishPos.x = fishPos.x + 12;
			}
			
			if (selfInput.isKeyDownBtn(keyList.one)) soundController.playSound("sfx.ogg", 0.2);
			if (selfInput.isKeyDownBtn(keyList.two)) soundController.playSound("sfx.ogg", 0.4);
			if (selfInput.isKeyDownBtn(keyList.three)) soundController.playSound("sfx.ogg", 0.6);
			if (selfInput.isKeyDownBtn(keyList.four)) soundController.playSound("sfx.ogg", 0.8);
			if (selfInput.isKeyDownBtn(keyList.five)) soundController.playSound("sfx.ogg", 1);
			
			var xOff = 128;
			var yOff = 128;
			rot += 2;
			rot %= 360;
			gfx.drawSprite(sprite3, 320-xOff, 240+yOff, 100, 100, 45+rot, 50, 50);
			gfx.drawSprite(sprite3, 320-xOff, 240-yOff, 100, 100, 45+rot, 50, 50);
			gfx.drawSpriteTiled(sprite3, 320, 240, 256, 256, 0, 128, 128, 2, 2);
			gfx.drawSprite(sprite3, 320+xOff, 240-yOff, 100, 100, 45+rot, 50, 50);
			gfx.drawSprite(sprite3, 320+xOff, 240+yOff, 100, 100, 45+rot, 50, 50);
			gfx.drawSprite(sprite2, fishPos.x, fishPos.y, 256, 256, 0, 128, 128, index, fishCol, 16, 3);
			index = (index + 1) % 16;
			
			//physics testing
			
			//move the sensor
			var dX = selfInput.isKeyDown(keyList.a) ? -5 : selfInput.isKeyDown(keyList.d) ? 5 : 0;
			var dY = selfInput.isKeyDown(keyList.w) ? -5 : selfInput.isKeyDown(keyList.s) ? 5 : 0;
			if (dX != 0 || dY != 0) sensor.setCenterPosition(dX, dY, true);
			
			//move the player
			//player.applyForce(-player._body.GetMass()*GRAVITY * Math.cos(45/180*Math.PI), player._body.GetMass()*GRAVITY);
			//player.applyForce(0, player._body.GetMass()*GRAVITY);
			player.applyDirectionalForce(player._body.GetMass()*GRAVITY, playerDir);
			player.step(selfInput.isKeyDownBtn(keyList.i));
			var movespeed = 200;
			var dX = selfInput.isKeyDown(keyList.left) ? -movespeed : 
					 selfInput.isKeyDown(keyList.right) ? movespeed : 0;
			player.walk(dX, true);
			
			if (selfInput.isKeyDown(keyList.up)) player.jump(movespeed*4);
			
			
			//step
			physics.stepSimulation();
			
			//draw the objs
			var drawPhysObj = function(o) {
				gfx.drawSprite(sprite, o.getDrawX(), o.getDrawY(), o.getWidth(), o.getHeight(),
						o.getAngle(), o.getDrawCenterX(), o.getDrawCenterY());
			};
			
			drawPhysObj(player);
			for(var i=0; i<objs.length; i++) {
				objs[i].applyForce(0, objs[i]._body.GetMass()*GRAVITY);
				drawPhysObj(objs[i]);
			}
			drawPhysObj(physFloor);
			drawPhysObj(sensor);
		}
	});
};