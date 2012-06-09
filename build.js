// r.js build configuration file
// (avaiable options: http://bit.ly/rCF5v5)
({

  baseUrl: './lib',

  // define paths for vendor dependencies
  paths: {
    // we use a jQuery adapter because we don't want
    // to include jQuery in the build
    jquery: '../support/jquery-adapter',
    underscore: '../vendor/underscore-1.3.1',
    backbone: '../vendor/backbone-0.9.2'
  },

  // use almond, a require.js shim, to allow usage
  // of ginseng without require.js
  name: '../vendor/almond',

  // optimize the output with uglify.js
  optimize: 'uglify',

  preserveLicenseComments: true,

  // only include ginseng.js because it holds
  // all the references
  include: ['ginseng'],

  // wrap build into a module and export ginseng either as AMD module
  // or, if no AMD loader is available, as global
  wrap: {
    start:  "(function(global) {",
    
    end:    " var Ginseng = require('ginseng');" +
            " if(global.define) {" +
                // define ginseng as AMD module with global AMD loader
            "   (function(define) {" +
            "     define(function() { return Ginseng; });" +
            "   }(global.define));" +
            " } else {" +
                // define ginseng in the global namespace
            "   global['Ginseng'] = Ginseng;" +
            " };" +
            "}(this));"
  },

  // save build in the following file
  out: './build/ginseng.js'

})
