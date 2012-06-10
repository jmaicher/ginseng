/**
 * A module that provides inheritance helpers
 *
 * @module ginseng/helpers/inheritance
 *
 * @requires underscore
 */
define([
  'underscore'
], function(
  _
) {
  'use strict';

  var exports = {

    /**
     * This function implements a pattern for pseudo-classical inheritance.
     * The returned "class" inherits from the given parent "class" with the
     * given additional prototype properties (= instance properties)
     * and static properties (= class properties).
     *
     * Example:
     * var Car = function() { .. };
     * var SportsCar = inherit(Car, { seats: 2 }, { vendors: ['ferrari', 'porsche'] };
     *
     * @param {function} parent from which the returned child will inherit
     * @param {object} [protoProps] object with prototype properties (= instance properties)
     * @param {object} [staticProps] object with static properties (= class properties)
     * @returns {function} child which inherits from parent with the given prototype and static properties
     */
    inherit: function(Parent, protoProps, staticProps) {

      var Child;

      // allow to provide custom constructor via protoProps.constructor
      if (protoProps && protoProps.hasOwnProperty('constructor')) {
        Child = protoProps.constructor;
      } else {
        // if no constructor has been provided we return default constructor
        // which uses the Parent constructor
        Child = function() {
          return Parent.apply(this, arguments);
        };
      }
      
      // inherit static properties from Parent
      // => copy all (static) properties from Parent to Child
      // @see http://documentcloud.github.com/underscore/#extend
      _.extend(Child, Parent);

      // inherit prototype properties from Parent via intermediate constructor 
      // to avoid having to invoke the Parent constructor directly (Child.prototype = new Parent())
      // which could create unwanted state or fail in absence of input arguments
      function F() {}
      F.prototype = Parent.prototype;
      Child.prototype = new F();

      // copy given prototype properties to Child
      // (may override Parent prototype properties)
      if(protoProps) {
        _.extend(Child.prototype, protoProps);
      }

      // copy given static properties to Child
      // (may override static Parent properties)
      if(staticProps) {
        _.extend(Child, staticProps);
      }

      // set Child's prototype constructor property to Child
      // else it would be Parent
      Child.prototype.constructor = Child;

      // make Parent's prototype available via Child's prototype __super__ property
      // this allows f.e. calling overriden methods: this.__super__.someOverridenFunction.call(this)
      Child.prototype.__super__ = Parent.prototype;

      return Child;
    },


    /**
     * This function implements the mixin pattern.
     * It extends a given object with all the properties from passed in object(s).
     *
     * Example:
     * var Car = function() {};
     * var Driveable = { drive: function() {} };
     * mixin(Car.prototype, Driveable);
     *
     * @param {object} target object
     * @param {object*} list of objects which properties will be mixed into target object
     */
    mixin: function(target) {
      _.extend.apply(null, arguments);

      return target;
    }

  };

  return exports;
});
