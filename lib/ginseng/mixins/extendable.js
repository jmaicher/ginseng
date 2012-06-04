define([
  '../helpers/inheritance'
], function(
  InheritanceHelpers
) {
  'use strict';

  var Extendable = {
    /** @lends Extendable# */ 

    /**
     * Create a new object ("child class") which inherits from this ("parent class").
     * Note: The new object will be extendable again
     *
     * @param {Object} [protoProps] object with prototype properties (= instance properties)
     * @param {Object} [staticProps] object with static properties (= class properties)
     *
     */
    extend: function(protoProps, staticProps) {
      var Child = InheritanceHelpers.inherit(this, protoProps, staticProps);

      return Child;
    }
  
  };

  return Extendable;
});
