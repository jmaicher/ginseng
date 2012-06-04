/**
 * A module that provides a View constructor.
 *
 * @module lib/view
 * @requires backbone
 */
define(['backbone'], function(Backbone) {
  'use strict';
  
  /**
   * Creates a view with the given options.
   * This constructor extends Backbone.View.
   *
   * @constructor
   *
   * @param {object} [options] - object hash with view options
   */
  var exports = Backbone.View.extend();

  return exports;
});
