/**
 * A module that provides a Model constructor.
 *
 * @module lib/model
 * @requires backbone
 */
define(['backbone'], function(Backbone) {
  'use strict';

  /**
   * Creates a model with given attributes and options.
   * This constructor extends Backbone.Model.
   *
   * @constructor
   *
   * @param {object} [attributes] - object hash with model attributes
   * @param {object} [options] - object hash with model options
   */
  var exports = Backbone.Model.extend();

  return exports;
});
