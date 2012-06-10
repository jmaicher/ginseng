/**
 * A module that provides a sandbox constructor
 *
 * @module ginseng/sandbox
 *
 * @requires underscore
 * @requires ginseng/mixins/mixable
 * @requires ginseng/mixins/extendable
 */
define([
  'underscore',
  'ginseng/mixins/mixable',
  'ginseng/mixins/extendable'
], function(
  _,
  Mixable,
  Extendable
) {
  'use strict';

  /**
   * Creates a sandbox instance
   *
   * @constructor
   *
   * @param {ginseng/core} core - core instance
   */
  var exports = function(core) {
    this.core = core; 
  };

  _.extend(exports.prototype, Mixable, {

    /**
     * Wrapper function for {@link module:ginseng/core#moduleFactory}.
     * This function is not intended to be used directly. It will be used
     * by {@link module:ginseng/module#moduleFactory} to allow modules to
     * create modules via the core.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} moduleOptions - object hash with module options
     *
     * @returns {moduleCtor} an instance of moduleCtor
     */
    moduleFactory: function(moduleCtor, moduleOptions) {
      return this.core.moduleFactory(moduleCtor, moduleOptions);
    },

    /**
     * Getter function for the core router.
     * @instance
     *
     * @returns {ginseng/router} core router
     */
    getRouter: function() {
      return this.core.router;
    }

  });

  _.extend(exports, Extendable);

  return exports;
});
