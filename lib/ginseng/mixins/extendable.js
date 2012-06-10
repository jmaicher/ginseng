/**
 * A module that provides an extendable mixin
 * 
 * @module ginseng/mixins/extendable
 *
 * @requires ginseng/helpers/inheritance
 */
define([
  '../helpers/inheritance'
], function(
  InheritanceHelpers
) {
  'use strict';

  var exports = {

    /**
     * Create a new object ("child class") which inherits from this ("parent class").
     * Note: The new object will be extendable again
     *
     * @param {object} [protoProps] object with prototype properties (= instance properties)
     * @param {object} [staticProps] object with static properties (= class properties)
     *
     * @returns {object} new child object
     */
    extend: function(protoProps, staticProps) {
      var Child = InheritanceHelpers.inherit(this, protoProps, staticProps);

      return Child;
    }
  
  };

  return exports;
});
