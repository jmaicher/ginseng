/**
 * A module that provides a mixable mixin
 * @module ginseng/mixins/mixable
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
     * Mixes given objects into call context
     *
     * @param {object*} objects to mix into this
     * @returns {object} mixed object
     */
    mixin: function() {
      // convert args to array and prepend this as first argument
      var args = Array.prototype.slice.call(arguments);
      args = [ this ].concat(args);

      // mixin objects and return this
      return InheritanceHelpers.mixin.apply(null, args);
    }
  
  };

  return exports;

});
