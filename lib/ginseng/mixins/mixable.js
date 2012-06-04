define([
  '../helpers/inheritance'
], function(
  InheritanceHelpers
) {
  'use strict';

  var Mixable = {
    /** @lends Mixable# */ 

    /**
     * Mixes given objects into this 
     * @args {Object*} objects to mix into this
     */
    mixin: function() {
      // convert args to array and prepend this as first argument
      var args = Array.prototype.slice.call(arguments);
      args = [ this ].concat(args);

      // mixin objects and return this
      return InheritanceHelpers.mixin.apply(null, args);
    }
  
  };

  return Mixable;

});
