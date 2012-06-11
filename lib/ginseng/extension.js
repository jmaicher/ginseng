/**
 * A module that provides a core extension constructor
 *
 * @module ginseng/extension
 *
 * @requires ginseng/mixins/extendable
 */
define([
  'underscore',
  './mixins/extendable'  
], function(
  _,
  Extendable  
) {
  'use strict';

  /**
   * Core extension constructor
   *
   * @constructor
   *
   * @param {ginseng/core} core - core to extend
   */
  var exports = function(core) { 
    this.core = core;
    this.initialize.call(this);
  };

  // make extension extendable
  exports.extend = Extendable.extend;

  _.extend(exports.prototype, {
  
    /**
     * Placeholder function which should be overwritten
     * by concrete extension.
     */
    initialize: function() {}

  });
  
  return exports; 
});
