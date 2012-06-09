require(['ginseng/sandbox'], function(Sandbox) {
  'use strict';

  describe('ginseng/sandbox', function() {
    var core, subject;

    beforeEach(function() {
      core = {};
      subject = new Sandbox(core);
    });
  
    describe('#constructor', function() {
      
      it('assigns given core as #core', function() {
        expect(subject.core).toBe(core);
      });

    });

    describe('#moduleFactory', function() {
      var moduleCtor, moduleOptions, module, moduleFactorySpy;

      beforeEach(function() {
        moduleCtor = function() {};
        moduleOptions = {};
        module = {};

        core.moduleFactory = function() {};
        moduleFactorySpy = spyOn(core, 'moduleFactory').andReturn(module);
      });

      it('calls core#moduleFactory with the given arguments', function() {
        subject.moduleFactory(moduleCtor, moduleOptions);

        expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, moduleOptions);
      });

      it('returns the module created by core#moduleFactory', function() {
        var result = subject.moduleFactory(moduleCtor, moduleOptions);

        expect(result).toBe(module);
      });

    }); // #moduleFactory


    describe('#getRouter', function() {
      var router;

      beforeEach(function() {
        router = {};
        core.router = router;
      });

      it('returns core#router', function() {
        expect(subject.getRouter()).toBe(core.router);
      });
    
    }); // #getRouter

  });

});
