/**
 * ginseng 0.1.1
 * (c) 2012, Julian Maicher (University of Paderborn)
 */
define([
  'underscore',
  'ginseng/core',
  'ginseng/extension',
  'ginseng/module',
  'ginseng/model',
  'ginseng/view',
  'ginseng/collection'
], function(
  Underscore,
  Core,
  Extension,
  Module,
  Model,
  View,
  Collection
) {

  var exports = {
    _: Underscore,
    Core: Core,
    Extension: Extension,
    Module: Module,
    Model: Model,
    View: View,
    Collection: Collection
  };

  return exports;

});
