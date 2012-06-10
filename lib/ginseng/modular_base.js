/**
 * A module that provides an abstract base for modular components.
 *
 * @module ginseng/modular_base
 * 
 * @requires underscore
 * @requires backbone
 * @requires ginseng/mixins/extendable
 * @requires ginseng/mixins/mixable
 */
define([
  'underscore',
  'backbone',
  './mixins/extendable',
  './mixins/mixable'
], function(
  _, Backbone,
  Extendable, Mixable
) {
  'use strict';

  /**
   * Creates an abstract base for modular components.
   * @constructor
   *
   * @param {object} [options] - object hash with modular base options
   */
  var exports = function(options) {
    var load, unload, finalize;

    // default arguments
    if(!options) options = {};
    
    // initialize instance variables
    this.options = options;
    this.modules = [];
    // the loaded flag indicates whether the module us currently loaded or not 
    // default: false = not loaded
    this.loaded = false;
    // the module is considered to be cold when it hasn't been loaded yet
    // default: true = cold
    this.cold = true;

    if(this.router && this.routes) {
      createRoutes.call(this);
    }

    // define/overwrite #load and ensure that prototype function #_load
    // is called after child function #load when child implements it
    load = this.load;
    this.load = function() {      
      if(_.isFunction(load))
        load.call(this);
      exports.prototype._load.call(this);
    };

    // define/overwrite #unload and ensure that prototype function #_unload
    // is called before child function #unload when child implements it
    unload = this.unload;
    this.unload = function() {
      exports.prototype._unload.call(this);
      if(_.isFunction(unload))
        unload.call(this);
    };

    // define/overwrite #finalize and ensure that prototype function #_finalize
    // is called before child function #finalize when child implements it
    finalize = this.finalize;
    this.finalize = function() {
      exports.prototype._finalize.call(this);
      if(_.isFunction(finalize))
        finalize.call(this);
    };
    
    this.initialize.call(this, options);
  };

  _.extend(exports.prototype, Mixable, Backbone.Events, {

    // dummy function which should be overwritten by concrete class
    initialize: function() {},

    _load: function() {
      if(this.cold) {
        if(this.router) {
          // bind all routes to it's callbacks and create
          // callbacks to autoload routable modules.
          // this only has to be done once, when the module
          // is cold (hasn't been loaded before)
          bindRoutes.call(this);
        }  
        // set the cold flag to false as soon as the
        // module has been loaded once
        this.cold = false;
      }

      // autoload modules
      _.each(_.filter(this.modules, function(module) {  return module.autoload === true; }), function(module) {
        module.instance.load();
      });

      // start router
      if(this.router) {
        this.router.start();
      }

      this.loaded = true;
    },

    _unload: function() {
      _.each(this.modules, function(module) {
        if(module.instance.loaded)
          module.instance.unload();
      });

      if(this.router) {
        this.router.stop();
      }

      this.loaded = false;
    },

    _finalize: function() {
      _.each(this.modules, function(module) {
        // if module is loaded -> unload it first
        if(module.instance.loaded)
          module.instance.unload();

        module.instance.finalize();
      });
    },

    /**
     * Dummy function which will be overwritten by core/module
     *
     * @instance
     */
    moduleFactory: function() { return null; },

    /**
     * Adds a new module instance from the given module constructor
     * with the given options to the instance. If the autoload parameter
     * is true the module gets automatically loaded. When the paramter
     * is set to false, it must be loaded manually. If autoload is a
     * String, it is expected to be a name of an existing route from #router.
     * Then, the module will automatically be loaded when #router triggers
     * matching route events.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} moduleOptions - object hash with module options
     * @param {boolean/string} [autoload=true] - true, false or route name
     *
     */
    addModule: function(moduleCtor, moduleOptions, autoload) {
      // default arguments
      if(_.isUndefined(moduleOptions)) {
        moduleOptions = {};
      }
      if(_.isUndefined(autoload)) {
        autoload = true;
      }

      // argument validation
      if(!_.isFunction(moduleCtor)) {
        throw new Error('moduleCtor argument must be a constructor');
      } 
      if(!_.isObject(moduleOptions)) {
        throw new Error('moduleOptions argument must be a options object');
      }
      // TODO: add path validation with regexp
      if(!_.isBoolean(autoload) && !_.isString(autoload)) {
        throw new Error('autoload argument must be a boolean or string');
      }
      if(_.isString(autoload) && !this.router) {
        throw new Error(this.toString() + ' is not routable and therefore cannot manage routable module at url fragment "' + autoload + '"');
      }

      if(_.isString(autoload)) {
        // autoload is routeName
        var routeName = autoload;
        
        // raise error when router doesn't define the route
        if(!this.router.hasRoute(routeName)) {
          throw new Error('Route with name ' + autoload + ' is not defined');
        }

        var baseRoute = this.router.getRoute(routeName),
            baseRouteName = routeName;

        if(this.router.baseRoute && this.router.baseRouteName) {
          baseRoute = this.router.baseRoute + '/' + baseRoute;
          baseRouteName = this.router.baseRouteName + '_' + baseRouteName; 
        }

        moduleOptions.baseRoute = baseRoute;
        moduleOptions.baseRouteName = baseRouteName;

      } else if( moduleOptions.baseRoute || moduleOptions.baseRouteName ) {
        // if autoload is not route but moduleOptions has baseRoute and/or baseRouteName
        // => delete properties
        delete moduleOptions.baseRoute;
        delete moduleOptions.baseRouteName;
      }

      var instance = this.moduleFactory(moduleCtor, moduleOptions);

      var module = {
        ctor: moduleCtor,
        instance: instance,
        autoload: autoload
      };

      this.modules.push(module); 

      // if the added module is routable all relative routes defined
      // by the module must also be created for this module (parent)
      // because the created module will be started automatically by this
      // module (parent) when the current url fragment matches a route defined
      // by the created module.
      if(isRoutableModule(module)) {
        createModuleRoutes.call(this, module);
      }

      return instance;
    },


    /**
     * Load the given module instance
     * @instance
     *
     * @param {ginseng/module} moduleInstance - module instance to load
     */
    loadModule: function(moduleInstance) {
      if(moduleInstance.loaded) return;
      
      if(moduleInstance.isRoutable()) {
        // unload routable modules
        _.chain(this.modules)
          .filter(function(module) { return isRoutableModule(module); })
          .each(function(module) {
            if(module.instance.loaded) {
              module.instance.unload();
            }
          });
      }

      moduleInstance.load(); 
    },

    /**
     * Returns an array containing the routes managed by the
     * module. If the module is not routable it returns an
     * empty array.
     *
     * @instance
     *
     * @returns {array} routes array
     */
    getRoutes: function() {
      if(!this.router) return [];
      return _.clone(this.router.routes);
    },

    /**
     * Returns true when module has routes and false otherwise
     * @instance
     *
     * @returns {boolean} true when module has routes, false otherwise
     */
    hasRoutes: function() {
      return ! _.isEmpty(this.getRoutes());
    }

  });

  _.extend(exports, Mixable, Extendable);



  // ######################
  // ## Helper functions ##
  // ######################

  /**
   * This function determines whether a given module instance is
   * routable or not.
   *
   * @private
   *
   * @param {object} module - module representation: ctor, instance and autoload
   * @returns {boolean} true when module is routable, false otherwise
   */
  var isRoutableModule = function(module) {
    return _.isString(module.autoload);
  };


  /**
   * This function creates routes from the #routes object.
   *
   * @private
   */
  var createRoutes = function() {
    var routes = [];
    for (var route in this.routes) {
      routes.unshift([route, this.routes[route]]);
    }
    for (var i = 0, l = routes.length; i < l; i++) {
      this.router.route(routes[i][0], routes[i][1]);
    } 
  };


  /**
   * This function creates routes on the current module router
   * which are managed by the given child module in order to
   * handle autoloading.
   *
   * @private
   *
   * @param {object} module - module representation: ctor, instance and autoload
   */
  var createModuleRoutes = function(module) {
    var moduleRoutes = module.instance.getRoutes(),
        relativeBaseRoute, relativeBaseRouteName;

    // return if module doesn't have routes
    if(_.isEmpty(moduleRoutes)) return;

    relativeBaseRoute = this.router.getRoute(module.autoload);
    relativeBaseRouteName = module.autoload;
    
    _.each(moduleRoutes, function(route) {
      // return if route is relative root url
      // because then it's already managed by this module router
      // (it's the same route as the route assigned to module.autoload)
      if(route.route === '') return;

      var prefixedRoute, prefixedRouteName;

      prefixedRoute = relativeBaseRoute + '/' + route.route;
      prefixedRouteName = relativeBaseRouteName + '_' + route.name;

      // when route is already defined -> do not add it again
      // this happens when the router is core router
      // because all routes are already created via the core router 
      if(!this.router.hasRoute(prefixedRouteName)) {
        this.router.route(prefixedRoute, prefixedRouteName , false );
      }

    }, this);
  };


  /**
   * This function binds routes to matching callback functions and
   * creates callbacks for module autoloading based on the routing.
   *
   * @private
   */
  var bindRoutes = function() { 
    // each callback has signature: value, key  (not key, value)
    _.each(this.getRoutes(), function(route) {

      // check if route is assigned to a module
      var module = _.find(this.modules, function(module) {
        return module.autoload === route.name;
      });

      if(module) {
        // if the route is assigned to a module look for all routes
        // with route/ as prefix because then they have been defined
        // by the module and therefore have to be assigned to the module as well
        _.chain(this.getRoutes())
          .filter(function(_route) {
            return _route.route.match( new RegExp('^' + route.route + '\/'));
          })
          // (route doesnt match route/)
          // => add route to the set of routes
          .union([route])
          .each(function(_route) {

            this.router.on('route:' + _route.name, function() {
              this.loadModule(module.instance);
            }, this);

          }, this);

      } else {
        if(this[route.name]) {
          this.router.on('route:' + route.name, this[route.name], this);
        }
      }

    }, this);
  };

  return exports;
});
