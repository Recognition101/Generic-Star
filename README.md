# Web Game Engine: Generic Star

## 1. Abstract

Generic Star is a library and rapid-prototyping tool for creating HTML5 Games. It is segmented into two main components: the core and the editor.

The core is a collection of wrappers around HTML5 functionality. The core’s goal is not to abstract too much of HTML5 away, but rather, to cut out some of the common roadblocks and boiler plate code required for complex HTML5 usage, such as WebGL.

The editor is an HTML frontend for quickly scaffolding games. The idea behind it is that a user can quickly throw images and sounds into a project and create some objects based off of common objects (such as a box, a wall, a platforming player). These common objects are called Generics. The user can then create some rooms (which are collections of objects), add their objects to the rooms and immediately run the game. The GUI allows for editing settings of the Generics to allow for a large breadth of games to be developed using generics alone.

However, once tweaking variables is no longer enough, the user can view the auto-generated HTML and Javascript and use the full power of the Generic Star Core to further enhance their game.
## 2. Quick-Start and Demo

### 2.1 Required Software

[Node.js](http://nodejs.org/) is required for running the editor. You can download and install it according to [their web site](http://nodejs.org/#download). [Google Chrome](http://google.com/chrome) is currently the only supported browser, so it is recommended that Chrome is installed as well.

### 2.2 Running the Static Demo

Node.js is not required for the static demo. This is because the static demo does not require write access to any files and only uses the core library. To run it, simply navigate to ./static-project-demo/ and open Main.html in Chrome.

### 2.3 Running the Editor

To run the demo, Node.js must be installed. To run it, make sure you are in the root directory of Generic Star and run:
node generic-star/node/server.js

If node was built from scratch or was not included in your path, your command may require the path to the node binary preceding it - but make sure you run the command from the root directory of Generic Star, not Node’s root directory.

Once the editor is running, you should get a message instructing you to visit a link in your browser. Simply go to that site to view the editor.

## 3. Architecture: General Style Guide

Generic Star is primarily written in Javascript, with the exception of GUI elements which are in HTML and CSS.

### 3.1 Javascript Style

Everything in Generic Star should be collected in the GenericStar object / namespace. If an object is directly in the GenericStar namespace, then it should be used directly by the games themselves in order to run. If an object is instead used for the editor (and thus does not need to be called in at a game’s runtime), it should be placed in the GenericStar.Editor object / namespace.

All classes and public functions should be prefaced with proper [JSDoc](http://code.google.com/p/jsdoc-toolkit/).

Classes are implemented as function-objects, and come in two flavors:
Library / GUI Class. This class is only ever instantiated by the library, and there are never many instances of this class at once. To create one of these classes, [closures](https://developer.mozilla.org/en/JavaScript/Guide/Closures) are used to guarantee privacy of variables, and all public and private variables and functions are defined within the constructor function using the “this” keyword. Inheritance is achieved through the use of [prototypes](https://developer.mozilla.org/en/JavaScript/Guide/Inheritance_constructor_prototype).
Instance Class. This class will scale to any number of instances at one time. This class is only used in scenarios when number of instances is unknown due to user allocation. All variables and functions are public and accessed with the “this” keyword. Every instance class should have a prototype to inherit from, even if it is just to define default values of variables.


This design, while complicated, allows for efficient usage of memory by not duplicating default values in instances of classes that are commonly instantiated.

### 3.2 GUI Style

The GUI is coded in HTML and CSS. GUI components are, whenever possible (ie: non-dynamically created elements) written into the CSS in modules. Each module has an ID, and all components of that module simply has a class name or name attribute. Each module has a corresponding javascript GUI class whose constructor takes a single dom node (the root node of the module). The GUI class then gathers all other required nodes by using node.getElementsByClassName. This design allows for modules to be reused without the risk of ID clashing.

As is often the case, CSS classes are to be reused whenever possible.

## 4. Architecture: Core

As mentioned before, the Core is the library that abstracts boiler-plate HTML5 code.

### 4.1 Core

This class is simply a container for all of the classes that need to be passed around to the game. It contains one instance of each of the following classes, along with set and get methods for game-wide settings.

### 4.2 Graphics

This class handles drawing to the canvas element on the main game page. It is designed around the idea of having Graphics Plugins. By having two plugins, one for WebGL and one for Canvas2D, the game core can fall back on canvas if WebGL is not present.

Both plugins support the same methods, which mainly revolve around loading sprites and drawing them to screen. The sprites can be tiled or cut out from a sprite sheet, rotated, stretched, etc.

Note that the WebGL Plugin uses the [glMatrix](http://code.google.com/p/glmatrix/) library for matrix transforms.

### 4.3 Input

This class simply attaches input handlers to the page and abstracts out the need for an event-driven system. Since the game is run step-by-step, it is easier to simply have a method that determines if a key is down and returns true or false, rather than dealing with events. This class abstracts out events by storing each key’s status and returning them whenever asked.
It works similarly for mouse position and mouse button status.

### 4.4 Sound

This class handles sound playback using HTML5 Audio. In order to minimize memory usage, the class makes a distinction between two playback methods: “background” and “effect”. Each sound can be played with either method. The background method can only play one instance of a given sound at once (thus saving memory by only needing to allocate one global instance of that sound) whereas the effect mode allocates new memory and plays back the sound, leaving it for the garbage collector to clean up.

### 4.5 Physics

This class is a wrapper around the [Box2D Web library](http://code.google.com/p/box2dweb/). It handles simple actions like creating boxes, circles, and polygons. It also handles creating a “player” object that has complicated physical properties specially tweaked to make it more like a classic platformer player. These tweaks include variable height jumping, wall-stickiness (used for wall-jumping) and different methods of movement (including changing movement types depending if the player is on the ground). Finally, the wrapper can also deal with creating different joints in a simple and easy to use fashion.

## 5. Architecture: Editor

### 5.1 Server

The server doesn’t contain state about what is going on in the GUI, and simply acts as a method of (safely) creating and removing files. The server acts as a basic file server with the ability to stream audio in order to allow for the Sound class. The server also acts as an upload point, adding files to whatever game is requested. Finally, the server also executes specialized commands such as reading saved object properties from generated code and overwriting those properties if the GUI changes them. Another important specialized command is the ability to copy templates (the boiler plate code that Generics generate) into games, adding settings and the correct namespace / class name to the created file.

Note that the Server uses the [Formidable](https://github.com/felixge/node-formidable) library for processing uploads.

### 5.2 GUI Classes

On the editor side, there are many specific classes.

#### 5.2.1 Static Library Classes: DomHelper, Library

These two classes handle static functions that execute common functionality either related to the editor in general (Library) or DOM (DomHelper). For instance DomHelper has methods to add and remove CSS Classes, while Library has methods for filtering names of objects and files from user input.

#### 5.2.2 Instance Library Classes: Clickaway, DropTarget

These two classes handle general non-static page interaction. Clickaway is an object that can be given functions to be run when a user clicks away from a DOM node (usually resulting in hiding that DOM node). Drop Target handles drag-and-drop file interaction for uploading files. A separate instance of Drop Target is used for each upload box (one for images, one for sounds).

#### 5.2.3 Nicety Classes: Notifications, and Modal Dialogs

These classes implement a polished version of javascript functions like alert. Notifications is used to show [Notify OSD](https://launchpad.net/notify-osd)-esque notifications in the top right (useful when errors occur, or things process successfully). Modal Dialogs handles showing button dialogs, along with file choosing dialogs (for choosing an image or sound).

#### 5.2.4 State Management Classes: GameLoader and Sidebar

These classes handle the global state. Each provide an interface for hooking into data-changed events such as “fire when the user loads a new game”, or “fire when the user changes an object, image, or sound setting”. These events are useful by the other classes that need to have an up-to-date listing of the files present in the current game. These classes are also the link via AJAX to the server to keep the disk synchronized with the current state. Sidebar, in addition to managing state, manges the GUI of the sidebar.

#### 5.2.5 Level Editor

The final class is the level editor. This handles drawing the rooms and allowing for users to add, remove, and modify instances inside of a room variable. While this class handles editing rooms, it does not keep track of them, it simply sends its changes to sidebar.

### 5.3 Game Generation Process

When the user creates a new game using the GUI, directories are created for images, sounds, code, and rooms.

#### 5.3.1 Images and Sounds

Images and sounds are simply added through the upload functionality of the server.

#### 5.3.2 Objects

A file is added to / modified in the code folder every time the user uses the GUI to create or edit a class based off of a Generic. To create this file, first it is copied from a template file which contains the code to run any variant of the Generic. Then, namespace and class name variables are replaced. Finally, the specific variable settings set by the user when cloning the Generic are appended to the end of the file.
It is important to note that when the file is edited, instead of being copied from the template corresponding to the Generic used, it is simply modified by replacing the settings at the bottom of the file with new settings. This is important as it maintains any code changes that the user may have made to the generated file.

#### 5.3.3 Rooms

A file is added to / modified in the rooms folder any time the editor decides that significant changes have been made and need to be saved to disk. Room saving is much simpler than object saving, as it only involves passing JSON. Since rooms are simply a few settings and a list of objects and their individually specialized settings (like position), rooms are easily serialized into JSON. Thus, to read a room, the file is simply read and passed back. Similarly, to write a room, the GUI just serializes the JSON and passes the string to the server to write.

## 6. Common Tasks

### 6.1 Adding a Generic

To add a generic, first create a template for the generic in the generic-star/node/templates directory. This template file must use $$GAME_NAME$$ and $$OBJECT_NAME$$ as the game and object names (since those are set by the user). The template file will be given all variables created in the next step. These variables can be accessed with the “this” keyword.

Next, the generic.js file must be edited. First, create a Generic object by setting its prototype to a new GenericStar.Editor.Generics.Generic(variables); instance, where variables is a JSON object containing variables to be set by the user (which will be accessible in the previous step). This object must be modeled like the other JSON variable containers in this file. The prototype must also contain getSelf (which returns a new instance of this object), __type (which just contains a string denoting the name of the generic), and draw, which is a method that is called in the level editor.

Finally, in generic.js, the GenericManifest class must be edited to include your Generic in its private generics object.

### 6.2 Editing the Main.html File

The Main.html file in the templates directory contains the main runner code that runs each generated game. It can be edited by keeping in mind the following macros:
$$GAME_NAME$$ will be replaced with the name of the game.
$$GAME_INCLUDES$$ will be replaced with a list of <script> tags that reference each auto-generated javascript file (both rooms and objects).