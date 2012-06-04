require([
  'ginseng/core',
  'ginseng/modular_base',
  'ginseng/router'  
], function(
  Core,
  ModularBase, Router
) {
  'use strict';

  describe('ginseng/core', function() {
  
    describe('constructor', function() {
      
      // see #router and #Sandbox specs

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

          spyOn(subject, 'Sandbox').andReturn(sandbox);

          subject.moduleFactory(moduleCtorSpy, options);

          expect(moduleCtorSpy).toHaveBeenCalledWith(sandbox, options);
        });

        it('returns the created module instance', function() {
          var module = {};
          moduleCtorSpy.andReturn(module);
          
          expect(subject.moduleFactory(moduleCtorSpy)).toBe(module);
        });

      }); // #moduleFactory

    }); // prototype


    describe('instance', function() {
      var subject;

      beforeEach(function() {
        subject = new Core();
      });

      describe('#Sandbox', function() { 
        var sandbox;

        beforeEach(function() {
          sandbox = new subject.Sandbox(subject);
        });

        describe('#constructor', function() {
          
          it('assigns given core as instance variable', function() {
            expect(sandbox.core).toBe(subject);
          });

        });

        describe('#moduleFactory', function() {
          var moduleCtor, moduleOptions, module, moduleFactorySpy;

          beforeEach(function() {
            moduleCtor = function() {};
            moduleOptions = {};
            module = {};
            moduleFactorySpy = spyOn(subject, 'moduleFactory').andReturn(module);
          });

          it('calls Core.prototype.moduleFactory with the given arguments', function() {
            sandbox.moduleFactory(moduleCtor, moduleOptions);

            expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, moduleOptions);
          });

          it('returns the module created by Core.prototype.moduleFactory', function() {
            var result = sandbox.moduleFactory(moduleCtor, moduleOptions);

            expect(result).toBe(module);
          });

        }); // #moduleFactory
        
        it('is not prototype function', function() {
          expect(Core.prototype.Sandbox).not.toBeDefined();
        });
        
      }); // Sandbox

      it('has #Sandbox ctor', function() {
        expect(subject.Sandbox).toBeDefined();
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
