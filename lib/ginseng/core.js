/**
 * A module that provides a core constructor
 *
 * @module ginseng/core
 * @extends module:ginseng/modular_base
 *
 * @requires underscore
 * @requires ginseng/modular_base
 * @requires ginseng/router
 * @requires ginseng/mixins/mixable
 */
define([
  'underscore',
  './modular_base',
  './router',
  './sandbox',
  './mixins/mixable'
], function(
  _,
  ModularBase,
  Router,
  Sandbox,
  Mixable
) {
  'use strict';

  /**
   * Creates a core with the given options
   *
   * @constructor
   */
  var exports = ModularBase.extend({
  
    /**
     * Constructor function
     * @instance
     *
     * @param {object} [options] - object hash with core options
     */
    constructor: function(options) {
      // default arguments
      if(!options) options = {};

      // a core always has a router
      this.router = new Router();

      // TODO: Refactor when implementing Sandbox extensions
      this.Sandbox = Sandbox;

      // invoke ModularBase ctor with given options
      ModularBase.call(this, options);
    },

    /**
     * Adds a new module instance from the given module constructor
     * with the given options to the core. This function overwrites
     * {@link module:ginseng/modular_base#addModule}.
     * Before calling super, it checks whether or not the autoload
     * parameter is a string and starts with '/'. If it does, then
     * it registers a new route on #router from the given autoload
     * parameter and forwards to super with the name of the created route.
     *
     * The reason for this is to autoload modules based on a root url
     * without having to hard-code the url into the client-side routing.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} - moduleOptions - object hash with module options
     * @param {boolean/string} [autoload=true] - true, false, route name
     *    or url starting with /
     *
     * @returns {moduleCtor} instance of the added module
     */
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


    /**
     * Returns a new module instance from the given module constructor
     * with a new #Sandbox instance and the given options. This function
     * will be used by @link{module:ginseng/modular_base#addModule}.
     *
     * @instance
     *
     * @params {function} moduleCtor - module constructor
     * @params {object} moduleOptions - object hash with module options
     *
     * @returns {moduleCtor} an instance of the given moduleCtor
     */
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


    /**
     * Returns a new sandbox instance.
     * @instance
     *  
     * @returns {ginseng/sandbox} a new sandbox instance
     */
    sandboxFactory: function() {
      return new this.Sandbox(this);
    }

  });

  return exports;
});
