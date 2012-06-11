require(['ginseng/extension'], function(Extension) {
  'use strict';

  describe('ginseng/extension', function() {
    var subject, core;

    beforeEach(function() {
      core = {};
      subject = new Extension(core);  
    });

    describe('#constructor', function() {
    
      it('assigns given core as instance variable #core', function() {
        expect(subject.core).toBe(core);
      });

      it('calls #initialize', function() {
        var spy = spyOn(Extension.prototype, 'initialize');

        new Extension(core);

        expect(spy).toHaveBeenCalled();
      });

    }); // #constructor

    describe('prototype', function() {

      describe('#initialize', function() {
      
        it('is defined', function() {
          expect(Extension.prototype.initialize).toBeDefined();
        });
      
      });
    
    }); // prototype

    it('is extendable', function() {
      expect(Extension).toBeExtendable();
    });

  });

});
