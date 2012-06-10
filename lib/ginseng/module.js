/**
 * A module that provides a module constructor
 *
 * @module ginseng/module
 * @extends module:ginseng/modular_base
 *
 * @requires underscore
 * @requires backbone
 * @requires ginseng/modular_base
 * @requires ginseng/module_router
 */
define([
  'underscore',
  'backbone',
  './modular_base',
  './module_router'
], function(
  _, Backbone,
  ModularBase, ModuleRouter
) {
  'use strict';

  /**
   * Creates a module with the given sandbox and options.
   *
   * @constructor
   */
  var exports = ModularBase.extend({
    
    /**
     * Constructor function
     *
     * @param {object} sandbox - sandbox which will be used by the module
     * @param {object} [options] - object hash with module options
     */
    constructor: function(sandbox, options) {
      // default arguments
      if(!options) options = {};
      
      // assign instance variables 
      this.sandbox = sandbox;
      extractOptions.call(this, options);
      
      // create router only if module is routable
      if(this.isRoutable()) {
        this.router = new ModuleRouter({
          router: this.sandbox.getRouter(),
          baseRoute: this.baseRoute,
          baseRouteName: this.baseRouteName
        });
      } else if (this.routes) {
        // throw error when routes object is defined
        // but the module is not routable
        throw new Error('This module is not allowed to have routes');
      }

      // invoke ModularBase ctor
      ModularBase.call(this, options);
    },
    

    /**
     * Returns a new module instance from the given module constructor
     * with the given options. It forwards the call to a moduleFactory
     * provided by the sandbox.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor function
     * @param {object} [moduleOptions] - object hash with module options 
     *
     * @returns {moduleCtor} an instance of the given moduleCtor 
     */ 
    moduleFactory: function(moduleCtor, moduleOptions) {
      return this.sandbox.moduleFactory(moduleCtor, moduleOptions);
    },


    /**
     * Determines whether the module is routable or not.
     * A module is routable when it's parent created it with a baseRoute
     * and a baseRouteName.
     *
     * @instance
     *
     * @returns {boolean} true when the module is routable, false otherwise
     */
    isRoutable: function() {
      return _.has(this, 'baseRoute') && _.has(this, 'baseRouteName');
    }

  });

  // ######################
  // ## Helper functions ##
  // ######################

  /**
   * Checks if the given options object has predefined
   * options and assigns these options as instance variables.
   *
   * This is a helper function and must be called in the context
   * of a module: extractOptions.call(this, options).
   *
   * @param {object} options - object hash with module options
   */  
  var extractOptions = function(options) {
    var optionsToExtract = [ 'el', 'baseRoute', 'baseRouteName' ];
   
    for (var i = 0, l = optionsToExtract.length; i < l; i++) {
      var attr = optionsToExtract[i];
      if (options[attr]) {
        this[attr] = options[attr];
      }
    }
  };

  return exports;
});
