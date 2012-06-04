/**
 * A module that provides a Collection constructor.
 *
 * @module lib/collection 
 * @requires backbone
 */
define(['backbone'], function(Backbone) {
  'use strict';

  /**
   * Creates a collection with the given models and options.
   * This constructor extends Backbone.Collection.
   *
   * @constructor
   *
   * @param {array} [models] - initial array of models
   * @param {object} [options] - object hash with collection options
   */
  var exports = Backbone.Collection.extend();

  return exports;
});
