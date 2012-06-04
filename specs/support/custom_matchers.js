/**
 * @name spec_support/custom_matchers
 *
 * @returns {Object} custom jasmine matchers
 * @see CustomMatchers
 */
define(['underscore'], function(_) {

  /**
   * Custom jasmine matchers
   * @static
   */
  var CustomMatchers = {

    /**
     * Checks if subject is mixable
     */
    toBeMixable: function() {
      return typeof this.actual.mixin === 'function';
    },

    /**
     * Checks if subject is extendable
     */
    toBeExtendable: function() {
      return typeof this.actual.extend === 'function';
    },

    toBeEventDispatcher: function() {
      return typeof this.actual.on === 'function'
        && typeof this.actual.off === 'function'
        && typeof this.actual.trigger === 'function'
    },

    /**
     * Checks if subject is function
     */
    toBeFunction: function() {
      return typeof this.actual === 'function';
    },

    /**
     * Checks if subject is array
     */
    toBeArray: function() {
      return _.isArray(this.actual);
    },

  };

  return CustomMatchers;
});
