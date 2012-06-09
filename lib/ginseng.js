define([
  'underscore',
  'ginseng/core',
  'ginseng/module',
  'ginseng/model',
  'ginseng/view',
  'ginseng/collection'
], function(
  Underscore,
  Core,
  Module,
  Model,
  View,
  Collection
) {

  var exports = {
    _: Underscore,
    Core: Core,
    Module: Module,
    Model: Model,
    View: View,
    Collection: Collection
  };

  return exports;

});
