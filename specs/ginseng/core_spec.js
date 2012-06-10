require([
  'ginseng/core',
  'ginseng/modular_base',
  'ginseng/sandbox',
  'ginseng/router'  
], function(
  Core,
  ModularBase,
  Sandbox,
  Router
) {
  'use strict';

  describe('ginseng/core', function() {
  
    describe('constructor', function() {
      
      // see #router specs

    }); // constructor


    describe('prototype', function() {
      var subject;

      beforeEach(function() {
        subject = new Core();
      });

      describe('#addModule', function() {
        var protoSpy, moduleCtor, moduleOptions, autoload;

        beforeEach(function() {
          protoSpy = spyOn(ModularBase.prototype, 'addModule');
          moduleCtor = function() {};
          moduleOptions = {};
          autoload = true;
        });

        describe('when autoload starts with /', function() {
          var routerRouteSpy, route, routeName;

          beforeEach(function() {
            routerRouteSpy = spyOn(subject.router, 'route');
            autoload = '/some/route';
            route = 'some/route';
            routeName = 'some_route';
          });

          it('creates the route via router', function() {
            subject.addModule(moduleCtor, moduleOptions, autoload);

            expect(routerRouteSpy).toHaveBeenCalledWith(route, routeName);
          });

          it('forwards call to ModularBase.prototype.addModule with created routeName as autoload argument', function() {
            subject.addModule(moduleCtor, moduleOptions, autoload);

            expect(protoSpy).toHaveBeenCalledWith(moduleCtor, moduleOptions, routeName);
          });

        });

        it('forwards call to ModularBase.prototype.addModule', function() {
          subject.addModule(moduleCtor, moduleOptions, autoload);

          expect(protoSpy).toHaveBeenCalledWith(moduleCtor, moduleOptions, autoload);
        });

        it('returns module instance returned by ModularBase.prototype.addModule', function() {
          var module = {}, 
              spy = protoSpy.andReturn(module),
              result;
           
          result = subject.addModule(moduleCtor, moduleOptions, autoload);

          expect(result).toBe(module);
        });

      });

      describe('#moduleFactory', function() {
        var moduleCtorSpy;

        beforeEach(function() {
          moduleCtorSpy = jasmine.createSpy('MyModule');
        });

        it('is prototype function', function() {
          expect($.isFunction(Core.prototype.moduleFactory)).toBe(true);
        });

        it('creates instance of the module constructor with a new sandbox and the given options', function() {
          var sandbox = {},
              options = {};

          spyOn(subject, 'sandboxFactory').andReturn(sandbox);

          subject.moduleFactory(moduleCtorSpy, options);

          expect(moduleCtorSpy).toHaveBeenCalledWith(sandbox, options);
        });

        it('returns the created module instance', function() {
          var module = {};
          moduleCtorSpy.andReturn(module);
          
          expect(subject.moduleFactory(moduleCtorSpy)).toBe(module);
        });

      }); // #moduleFactory

     
     
      describe('#sandboxFactory', function() {

        xit('creates instance of ginseng/sandbox with core as parameter');
        xit('returns instance of ginseng/sandbox');

      });

    }); // prototype


    describe('instance', function() {
      var subject;

      beforeEach(function() {
        subject = new Core();
      });

      it('has #router', function() {
        expect(subject.router).toBeDefined();
      });

    }); // instance
 
  
    it('extends core/modular_base', function() {
      expect(new Core() instanceof ModularBase).toBe(true);
    });

  }); // core/core

});
