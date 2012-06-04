require([
  'ginseng/helpers/inheritance'
] , function(
  InheritanceHelpers
) {
  'use strict';

  describe("ginseng/helpers/inheritance", function() {

    // #########################
    // ## static method: inherit
    // #########################

    describe(".inherit", function() {
  
      var Car = function(vendor, model, color, seats) {
        this.vendor = vendor;
        this.model = model;
        this.color = color;
        this.seats = seats;
      };

      Car.prototype.description = function() {
        return this.vendor + " " + this.model + " has color " + this.color + " and " + this.seats + " seats.";
      };

      Car.vendors = [ "VW", "BMW", "Mercedes", "Opel", "Toyota", "Ferrari", "Porsche" ]

      describe("when prototype properties are given", function() {

        var protoProps;

        beforeEach(function() {
          protoProps = {};
        });

        describe("when constructor property is set", function() {

          it("returns Child which uses the given constructor property as constructor", function() {
            protoProps.constructor = function(vendor, model, color) {
              Car.apply(this, [vendor, model, color, 2])
            };

            var SportsCar = InheritanceHelpers.inherit(Car, protoProps);
            var f440 = new SportsCar('Ferrari', '440', 'red');
            
            expect(f440.seats).toBe(2)
          });
         
        });

        it("returns Child with the given prototype properties", function() {
          protoProps.race = function() {};
          var SportsCar = InheritanceHelpers.inherit(Car, protoProps);

          expect(SportsCar.prototype.race).toBeDefined();
        });

        it("overrides Parent prototype properties with given prototype properties", function() {
          protoProps.toString = function() {};
          var SportsCar = InheritanceHelpers.inherit(Car, protoProps);

          expect(SportsCar.prototype.toString).toBe(protoProps.toString);
        }); 

      });

      describe("when static properties are given", function() {
      
        var staticProps;

        beforeEach(function() {
          staticProps = {};
        });

        it("returns Child with the given static properties", function() {
          staticProps.Factory = function() {};
          var SportsCar = InheritanceHelpers.inherit(Car, null, staticProps);

          expect(SportsCar.Factory).toBeDefined();
        });

        it("overrides static Parent properties with given static properties", function() {
          staticProps.vendors = ['Ferrari', 'Porsche'];
          var SportsCar = InheritanceHelpers.inherit(Car, null, staticProps);

          expect(SportsCar.vendors).toBe(staticProps.vendors);
        });
      
      });
     
      it("returns Child which uses the Parent constructor", function() {
        var SportsCar = InheritanceHelpers.inherit(Car);
        var f440 = new SportsCar('Ferrari', '440', 'red', '2');

        expect(f440.vendor).toBe('Ferrari');
      });

      it("returns Child which inherits static properties from Parent", function() {
        var SportsCar = InheritanceHelpers.inherit(Car);

        expect(typeof SportsCar.vendors).toBe('object');
      });

      it("returns Child which inherits prototype properties from Parent", function() {
        var SportsCar = InheritanceHelpers.inherit(Car);

        expect(typeof SportsCar.prototype.description).toBe('function');
      });

      it("returns Child which inherits prototype properties from Parent via intermediate constructor", function() {
        var Car = jasmine.createSpy('Car');
        var SportsCar = InheritanceHelpers.inherit(Car);

        expect(Car).not.toHaveBeenCalled();
      });

      it("sets Child's prototype constructor property to Child", function() {
        var SportsCar = InheritanceHelpers.inherit(Car);

        expect(SportsCar.prototype.constructor).toBe(SportsCar);
      });

      it("sets Child's prototype __super__ property to Parent's prototype", function() {
        var SportsCar = InheritanceHelpers.inherit(Car);

        expect(SportsCar.prototype.__super__).toBe(Car.prototype);
      });
      
    }); // .inherit 
  

    // #######################
    // ## static method: mixin
    // #######################

    describe('.mixin', function() {
    
      var Car;

      var Driveable = {
        drive: function() {},
        accelerate: function() {},
        break: function() {}
      };
      
      var Crashable = {
        crash: function() {}
      };

      var Extendable = {
        extend: function() {}
      };

      beforeEach(function() {
        Car = function() {};
      });

      it('mixes single object into target', function() {
        InheritanceHelpers.mixin(Car, Extendable);
        expect(Car.extend).toBe(Extendable.extend);
      });

      it('mixes multiple objects into target', function() {
        InheritanceHelpers.mixin(Car.prototype, Driveable, Crashable);
        expect(Car.prototype.drive).toBe(Driveable.drive);
        expect(Car.prototype.crash).toBe(Crashable.crash);
      });

      it('returns the target object', function() {
        expect(InheritanceHelpers.mixin(Car, Driveable)).toBe(Car);
      });

      it('returns the target object when no mixin objects are given', function() {
        expect(InheritanceHelpers.mixin(Car)).toBe(Car); 
      });
   
    });

  }); // InheritanceHelpers

});
