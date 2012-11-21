Ginseng.js - README
===================

**Ginseng.js** provides a modular application architecture for large-scale JavaScript applications. It is built on top of [Backbone.js](http://backbonejs.org/) and has been inspired by the concepts of [Scalable JavaScript Application Architecture](https://www.youtube.com/watch?v=vXjVFPosQHw) by [Nicholas Zakas](https://twitter.com/slicknet) and [Patterns For Large-Scale JavaScript Application Architecture](http://addyosmani.com/largescalejavascript/) by [Addy Osmani](http://twitter.com/addyosmani).

**Note:** This project is unmaintained and more sophisticated application architectures for Backbone.js including [Chaplin.js](http://chaplinjs.org/) and [Marionette.js](http://marionettejs.com/) have emerged since the initial development of Ginseng in 2012.

# Application Core and Modules

The Core is at the heart of every application and is responsible for the overall lifecycle management. Therefore, it automatically initializes and starts/stops Application Modules when needed.

```JavaScript
// Defining the Application Core
var AppCore = Ginseng.Core.extend();

// Defining a module
var Module = Ginseng.Module.extend({
  load: function() {
    this.render();
  },
   
  render: function() {
    this.view = new Backbone.View({ el: '<p>Hello World</p>' });
     
    $(this.el).html(
      this.view.render().el
    );
  }
});

// Initializing the Core
var appCore = new AppCore();

// Adding a module to the Core
appCore.addModule(Module, {
  el: '#content'
});

// The module loads automatically with the Core
appCore.load();
```

Similar to the Core, a module can also contain arbitrary many child modules. The lifecycle of the children is then  automatically managed by the parent module:

```JavaScript
var Child = Ginseng.Module.extend({
  load: function() {
    console.log("Hello World");
  }
});

var Parent = Ginseng.Module.extend({
  initialize: function() {
    this.addModule(Child);
  }
});

var AppCore = Ginseng.Core.extend({
  initialize: function() {
    this.addModule(Parent);
  }
});

var appCore = new AppCore();
appCore.load();
```

# Sandbox and Core Extensions

The Sandbox is an abstraction of the Core and provides arbitrary functionalitiy for all modules. This additional layer of abstraction is intended to avoid that modules touch the Core and anything outside of their own scope directly.

By default, the Sandbox only provides access to the global Application Router and should be extended with application-specific Core Extensions:

```JavaScript
// Define a Core Extension
var CurrentUserExtension = Ginseng.Extension.extend({
 initialize: function() {
   // Extend the Core itself
   this.core.getCurrentUser = this.getCurrentUser;
 },

 getCurrentUser: function() {
   return { foo: 'bar' };
 },

 // Extend the Core's Sandbox
 Sandbox: {
   getCurrentUser: function() {
     return this.core.getCurrentUser();
   }
 }
});

var Module = Ginseng.Module.extend({
  load: function() {
  	// Access the Sandbox extension from the Module
    console.log(this.sandbox.getCurrentUser());
  }
});

var AppCore = Ginseng.Core.extend({
  initialize: function() {
  	// Add Extension and Module to the Core
    this.addExtension(CurrentUserExtension);
    this.addModule(Module);
  },
  
  load: function() {
  	// Access the Core Extension directly
  	console.log(this.getCurrentUser());
  }
});
```

# Module Lifecycle and Routable Modules

By default, all modules are automatically loaded with their respective parent. In practice, however, this is oftentimes not desired as the lifecycle of child modules may vary from that of the parent. The module lifecycle can therefore also be managed manually:

```JavaScript
var Module = Ginseng.Module.extend();

var AppCore = Ginseng.Core.extend({
  initialize: function() {
  	var autoload = false,
  		options = {};
  		
  	// addModule returns the module instance
    this.module = this.addModule(Module, options, autoload);
  },
  
  onEvent: function() {
  	// Manually load a module
	this.module.load();
  },
  
  onAnotherEvent: function() {
  	// Manually load a module
	this.module.unload();
  }
});
```

Besides manual lifecycle management, Ginseng also allows to associate the lifecycle of modules to specific routes. A common case for Routable Modules is a page with several distinct sub sections that are represented by separate child modules. A simple example for Routable Modules is outlined in the following:

```JavaScript
var FooModule = Ginseng.Module.extend({
  load: function() {
    console.log("FooModule loaded")
  }
});

var BarModule = Ginseng.Module.extend({
  load: function() {
    console.log("BarModule loaded")
  }  
});

var App = Ginseng.Core.extend({
  routes: {
    '': 'root',
    'base/foo': 'foo',
    'base/bar': 'bar'
  },

  initialize: function() {
    this.addModule(FooModule, {}, 'foo');
    this.addModule(BarModule, {}, 'bar');
  },
  
  root: function() {
    console.log("Root route triggered")
  }
});
```

When the Application Router (Core#router) triggers the `/base/foo` route, the FooModule is loaded. Given the `/base/bar` route is triggered afterwards, the FooModule is first unloaded and then the BarModule is loaded.

Similar to the Core, a Routable Module can in turn also define routes and associate the lifecycle of child modules to relative route fragments.

```JavaScript
var BarModule = Ginseng.Module.extend({
  load: function() {
    console.log("BarModule loaded")
  }  
});

var FooModule = Ginseng.Module.extend({
  routes: {
    'bar': 'bar'
  },
  
  initialize: function() {
     this.addModule(BarModule, {}, 'bar');
  }, 
  
  load: function() {
    console.log("FooModule loaded")
  }
});

var App = Ginseng.Core.extend({
  routes: {
    'foo': 'foo',
  },
  
  initialize: function() {
    this.addModule(FooModule, {}, 'foo');
  },  
});
```
When the route `/foo/bar` is triggered by the Application Router, both, the FooModule and the BarModule will be loaded successively.

**Check out the specs and docs for more information.**

# Development

Prerequisites:

- [Ruby]() >= 1.9
- [Node.js]() >= 10.0
- [JSHint]() (npm install jshint)

Build with:

```
$ rake build
```

---

# License

**The MIT License**

Copyright (c) 2012 - 2014 Julian Maicher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.