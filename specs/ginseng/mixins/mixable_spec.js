require([
  'ginseng/mixins/mixable'
], function(
  Mixable
) {
  'use strict';

  // TODO: We should mock InheritanceHelpers.mixin because these tests are redundant
  describe('ginseng/mixins/mixable', function() {
  
    it('provides mixin function', function() {
      expect(typeof Mixable.mixin).toBe('function');
    });

    describe('.mixin', function() {
    
      var Car,
          mustang;

      var Driveable = {
        drive: function() {}
      };

      var Crashable = {
        crash: function() {}
      };

      beforeEach(function() {
        Car = function() {};
        Car.prototype.mixin = Mixable.mixin;
        mustang = new Car();
      });

      it('mixes single object into this', function() {
        mustang.mixin(Driveable);
        expect(mustang.drive).toBe(Driveable.drive);
      });

      it('mixes multiple objects into this', function() {
        mustang.mixin(Driveable, Crashable);
        expect(mustang.drive).toBe(Driveable.drive);
        expect(mustang.crash).toBe(Crashable.crash); 
      });

      it('returns this', function() {
        expect(mustang.mixin(Driveable)).toBe(mustang);
      });

      it('returns this when no mixin objects are given', function() {
        expect(mustang.mixin()).toBe(mustang); 
      });

    });

  });

});
