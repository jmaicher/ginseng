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

    moduleFactory: function(moduleCtor, moduleOptions) {
      return this.core.moduleFactory(moduleCtor, moduleOptions);
    },

    getRouter: function() {
      return this.core.router;
    }

  });

  _.extend(exports, Extendable);

  return exports;
});
