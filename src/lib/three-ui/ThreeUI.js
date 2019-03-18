import anchors from './anchors.js';
import BitmapText from './BitmapText.js';
import Rectangle from './Rectangle.js';
import Sprite from './Sprite.js';
import Text from './Text.js';

import { isFirefox } from './utils/browserDetection.js';

// All properties that when adjusted will force a redraw of the UI
var dirtyProperties = ['x','y','width','height','rotation','alpha','visible','pivot','anchor','smoothing','stretch','offset','text','scale','parent','textAlign','assetPath','color','left','right','up','down','ActiveInvoke'];

var observeDirtyProperties = function(object, ui) {
	dirtyProperties.forEach(function(prop) {
		var proxyKey = '_proxied_' + prop;

		// Make sure initial values are set first
		object[proxyKey] = object[prop];

		Object.defineProperty(object, prop, {
			set: function(value) {
				if (object[prop] !== value) {
					ui.shouldReDraw = true;
				}

				object[proxyKey] = value;
			},

			get: function() {
				return object[proxyKey];
			},
		});
	});
};

/**
 * ThreeUI
 *
 * UI Class that renders an internal 2d canvas onto a plane
 *
 * @param {HTMLCanvasElement} gameCanvas
 * @param {int} height The pixel height of this UI -- Default: 720
 * @param {bool} renderOnQuad Render on a quad, if false, canvas will be in DOM
 */

var ThreeUI = function(gameCanvas, height, renderOnQuad) {
	this.displayObjects = [];
	this.eventListeners = {
		click: [],
	};

	this.clearRect = null;
	this.gameCanvas = gameCanvas;
	this.canvas = document.getElementById("foreground");
	this.context = this.canvas.getContext('2d');
	this.renderOnQuad = renderOnQuad || false;
	this.shouldReDraw = true;

	if (this.renderOnQuad) {
		this.prepareThreeJSScene();
	} else {
		//this.addCanvasToDom();
	}

	this.resize();
};

/**
 * Attach anchor types to ThreeUI
 */

ThreeUI.anchors = anchors;

ThreeUI.prototype.addCanvasToDom = function() {
	this.gameCanvas.parentNode.appendChild(this.canvas);

	// Make sure the gameCanvas has position
	/*if (['relative', 'absolute', 'fixed'].indexOf(this.gameCanvas.style.position) === -1) {
		this.gameCanvas.style.position = 'relative';
	}*/

	//this.canvas.style.position = 'absolute';
	//this.canvas.style.left = 0;
	//this.canvas.style.top = 0;
	/*this.canvas.style.zIndex = 1;
	this.canvas.style.transformOrigin = '0% 0%';
	this.canvas.style.perspective = '1000px'; // Hardware acceleration!*/
};

/**
 * Internal method that does all preparations related to ThreeJS, creating the scene, camera, geometry etc.
 */

ThreeUI.prototype.prepareThreeJSScene = function() {
	this.camera = new THREE.OrthographicCamera(
		-this.canvas.width / 2,
		this.canvas.width / 2,
		this.canvas.height / 2,
		-this.canvas.height / 2,
		0, 30
	);

	this.scene = new THREE.Scene();

	this.texture = new THREE.Texture(this.canvas);

	var material = new THREE.MeshBasicMaterial({ map: this.texture });
	material.transparent = true;

	var planeGeo = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height);
	this.plane = new THREE.Mesh(planeGeo, material);
	this.plane.matrixAutoUpdate = false;

	this.scene.add(this.plane);
};

/**
 * Recalculate UI dimensions
 */

ThreeUI.prototype.resize = function() {
	//var gameCanvasAspect = this.gameCanvas.width / this.gameCanvas.height;
	//this.width = this.height * gameCanvasAspect;

	this.width = 800;
	this.height = 400;

	//this.canvas.width = this.width
	//this.canvas.height = this.height;


	//var containerWidth = this.gameCanvas.parentNode.getBoundingClientRect().width;
	//this.canvas.style.transform = 'scale(' + (containerWidth / this.width) + ')';

	this.shouldReDraw = true;
};

/**
 * Draw the UI
 */

ThreeUI.prototype.draw = function() {
	if (!this.shouldReDraw) return;

	// Reset canvas
	if (this.clearRect) {
		//this.context.clearRect(this.clearRect.x, this.clearRect.y, this.clearRect.width, this.clearRect.height);
	} else {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	var self = this;
	var length = this.displayObjects.length;
	for (var i = 0;i < length;i++) {
		// 앵커와 위치를 조절한다
		this.displayObjects[i].render(self.context);
	}

	// Make sure the texture gets re-drawn
	if (this.renderOnQuad) {
		this.texture.needsUpdate = true;
	}

	this.shouldReDraw = false;
};

/**
 * Render the UI with the provided renderer
 *
 * @param {THREE.WebGLRenderer} renderer
 */

ThreeUI.prototype.render = function(renderer) {
	this.draw();

	if (this.renderOnQuad) {
		renderer.render(this.scene, this.camera);
	}

	if (this.colorReplace) {
		this.context.save();

		this.context.fillStyle = this.colorReplace
		this.context.globalCompositeOperation = 'source-atop';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.context.restore();
	}
};

/**
 * Create a new Sprite
 *
 * @param {string} imagePath
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Sprite}
 */

ThreeUI.prototype.createSprite = function(imagePath, x, y, width, height) {
	var displayObject = new Sprite(this, imagePath, x, y, width, height);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new Sprite from a sheet
 *
 * @param {string} imagePath
 * @param {string} sheetImagePath
 * @param {string} sheetDataPath
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Sprite}
 */

ThreeUI.prototype.createSpriteFromSheet = function(imagePath, sheetImagePath, sheetDataPath, x, y, width, height) {
	var displayObject = new Sprite(this, imagePath, x, y, width, height, sheetImagePath, sheetDataPath);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new Rectangle
 *
 * @param {string} color
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Rectangle}
 */

ThreeUI.prototype.createRectangle = function(color, x, y, width, height) {
	var displayObject = new Rectangle(this, color, x, y, width, height);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new Text
 *
 * @param {string} text
 * @param {string} font
 * @param {string} color
 * @param {int} x
 * @param {int} y
 *
 * @return {Text}
 */

ThreeUI.prototype.createText = function(text, font, color, x, y) {
	var displayObject = new Text(this, text, font, color, x, y);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new BitmapText
 *
 * @param {string} text
 * @param {string} font
 * @param {string} color
 * @param {int} x
 * @param {int} y
 *
 * @return {BitmapText}
 */

ThreeUI.prototype.createBitmapText = function(text, size, x, y, sheetImagePath, sheetDataPath) {
	var displayObject = new BitmapText(this, text, size, x, y, sheetImagePath, sheetDataPath);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Add a new event listener, called by ThreeUI.DisplayObject
 * Shouldn't be used directly
 *
 * @param {string} type
 * @param {Function} callback This callback is called when the event is triggered, and is passed the DisplayObject as a first argument
 * @param {ThreeUI.DisplayObject} displayObject
 */

ThreeUI.prototype.addEventListener = function(type, callback, displayObject) {
	this.eventListeners[type].push({
		callback: callback,
		displayObject: displayObject
	});
};

/**
 * Used internally to determine which registered click event listeners should be called upon click
 *
 * @param {MouseEvent} event
 */

ThreeUI.prototype.clickHandler = function(x, y) {
	const coords = { x: x, y: y };

	//coords = this.windowToUISpace(coords.x, coords.y);

	var callbackQueue = [];
	this.eventListeners.click.forEach(function(listener) {
		var displayObject = listener.displayObject;
		if (!displayObject.shouldReceiveEvents()) return;

		var bounds = displayObject.getBounds();

		// 완전히 잘못만들었다...
		// 제일 자식노드를 찾아서 클릭시켜야 하는데..
		// 이거 만든 녀석은 바보냐;
		if (ThreeUI.isInBoundingBox(coords.x, coords.y, bounds.x, bounds.y, bounds.width, bounds.height)) {
			// Put listeners in a queue first, so state changes do not impact checking other click handlers
			callbackQueue.push(listener.callback);
		}
	});

	let result = false;

	callbackQueue.forEach(function(callback){
		callback();
		result = true;
	});

	return result;
};

/**
 * Helper method that converts a point to UI space from window space
 *
 * @param {int} x
 * @param {int} y
 *
 * @return {Object} x,y coordinates
 */

ThreeUI.prototype.windowToUISpace = function(x, y) {
	var bounds = this.gameCanvas.getBoundingClientRect();
	var scale = this.height / bounds.height;

	return {
		x: (x - bounds.left) * scale,
		y: (y - bounds.top) * scale,
	};
}

/**
 * Moves a ui element to the back of the displayobject queue
 * which causes it to render above other objects
 *
 * @param {ThreeUI.DisplayObject} displayObject
 */
ThreeUI.prototype.moveToFront = function(displayObject) {
	var elIdx = this.displayObjects.indexOf(displayObject);

	if (elIdx > -1) {
		this.displayObjects.splice(elIdx, 1);
	}

	this.displayObjects.push(displayObject);
};

/**
 * Helper method used to determine whether a point is inside of a given bounding box
 *
 * @param {int} x
 * @param {int} y
 * @param {int} boundX
 * @param {int} boundY
 * @param {int} boundWidth
 * @param {int} boundHeight
 *
 * @return {bool}
 */

ThreeUI.isInBoundingBox = function(x, y, boundX, boundY, boundWidth, boundHeight) {
	return (
		x >= boundX &&
		x <= boundX + boundWidth &&
		y >= boundY &&
		y <= boundY + boundHeight
	);
};

// Export ThreeUI as module
export default ThreeUI;
