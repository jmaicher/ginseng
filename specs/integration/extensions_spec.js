require(['ginseng'], function(Ginseng) {
  'use strict';

  describe('core extensions', function() {

    var Core, Extension, Module,
        core;
 
    Extension = Ginseng.Extension.extend({
    
      initialize: function() {
        this.core.foo = this.foo;
      },

      foo: function() {
        return 'bar';
      },

      Sandbox: {
        foo: function() {
          return this.core.foo();
        }
      }
    
    });

    Core = Ginseng.Core.extend({
    
      initialize: function() {
        this.addExtension(Extension);
      }

    });

    Module = Ginseng.Module.extend({
    
      initialize: function() {
        var foo = this.sandbox.foo();
      }

    });

    beforeEach(function() {
      core = new Core();
    });

    it('expose Sandbox functions which are available to modules', function() {
      var spy = spyOn(core, 'foo');
      
      core.addModule(Module);

      expect(spy).toHaveBeenCalled();
    });
  
  });

});
