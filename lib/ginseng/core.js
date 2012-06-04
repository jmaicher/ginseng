define([
  'underscore',
  './modular_base',
  './router',
  './mixins/mixable'
], function(
  _,
  ModularBase, Router,
  Mixable
) {
  'use strict';

  var Core = ModularBase.extend({
  
    constructor: function(options) {
      // default arguments
      options || (options = {});

      // create Sandbox ctor
      createSandboxCtor.call(this);
      
      // a core always has a router
      this.router = new Router();

      // invoke ModularBase ctor with given options
      ModularBase.call(this, options);
    },

    addModule: function(moduleCtor, moduleOptions, autoload) {
      var route, routeName;

      // when autoload is root path (starts with /)
      if(_.isString(autoload) && autoload.indexOf('/') === 0) {
        // remove leading / because backbone routes start without /
        route = autoload.slice(1);
        // replace / in route with _ to obtain a valid route name
        routeName = route.replace(/\//g, '_');
        
        // create route
        this.router.route(route, routeName);

        // set autoload to routeName
        autoload = routeName;
      }

      return ModularBase.prototype.addModule.call(this, moduleCtor, moduleOptions, autoload);
    },

    moduleFactory: function(moduleCtor, moduleOptions) {
      var F = function() {},
          instance, module, args, sandbox;

      // create instance of the module without calling the constructor function
      F.prototype = moduleCtor.prototype;
      instance = new F();

      // apply constructor function to the created instance
      // maybe the constructor returns interface with public functions
      // => the return value will be our module.
      sandbox = this.sandboxFactory();
      module = moduleCtor.call(instance, sandbox, moduleOptions) || instance;

      return module;
    },

    sandboxFactory: function() {
      return new this.Sandbox(this);
    }

  });

  // ######################
  // ## Helper functions ##
  // ######################

  var createSandboxCtor = function() {
    this.Sandbox = function(core) {
      this.core = core;
    };

    _.extend(this.Sandbox.prototype, Mixable, {
    
      moduleFactory: function(moduleCtor, moduleOptions) {
        return this.core.moduleFactory(moduleCtor, moduleOptions);
      },

      getRouter: function() {
        return this.core.router;
      }

    });
  };


  return Core;
});
