// This module acts as jQuery adapter and returns the global
// jQuery object.
//
// This is a workaround to create builds without jQuery.
// The Backbone AMD module requires jQuery. If the jQuery module
// is excluded from the build, almond will throw an exception. 
// (See: https://github.com/jrburke/almond/issues/12)
define(function() {
  return jQuery;
});
