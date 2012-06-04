require([
  'ginseng/module',
  'ginseng/modular_base',
  'ginseng/module_router'
], function(
  Module,
  ModularBase, ModuleRouter
) {
  'use strict';

  describe('ginseng/module', function() {
    var subject, sandbox;

    beforeEach(function() {
      sandbox = {}
      subject = new Module(sandbox)
    });
      
    describe('constructor', function() {

      describe('when module has routes property', function() {
        var ModuleWithRoutes, baseRoute, baseRouteName, route, routeName;

        beforeEach(function() {
          route = 'relative/route';
          routeName = 'relative_route';

          ModuleWithRoutes = Module.extend({
            routes: {}
          });

          ModuleWithRoutes.prototype.routes[route] = routeName;

          baseRoute = 'base/route';
          baseRouteName = 'base_route_name';
        });

        it('throws error when options argument does not contain baseRoute property', function() {
          expect( function() { new ModuleWithRoutes( sandbox, { baseRouteName: baseRouteName }) } ).toThrow();
        });

        it('throws error when options argument does not contain baseRouteName property', function() {
          expect( function() { new ModuleWithRoutes( sandbox, { baseRoute: baseRoute } )} ).toThrow();
        });

        describe('when options argument contains baseRoute and baseRouteName property', function() {
          var sandboxRouter;

          beforeEach(function() {
            sandboxRouter = { route: function() {} }
            sandbox.getRouter = function() { return sandboxRouter };
            subject = new ModuleWithRoutes( sandbox, { baseRoute: baseRoute, baseRouteName: baseRouteName } );
          });

          describe('#router', function() {
          
            it('wraps router provided via sandbox', function() {
              expect(subject.router.router).toBe(sandboxRouter);
            });

            it('has provided baseRoute', function() {
              expect(subject.baseRoute).toBe(baseRoute);
            });

            it('has provided baseRouteName', function() {
              expect(subject.baseRouteName).toBe(baseRouteName);
            });

          }); // #router


          it('creates #router from type core/module_router', function() {
            expect(subject.router instanceof ModuleRouter).toBe(true);
          });
       
        }); // when options argument contains...

      }); // when module has #routes property


      it('assigns given sandbox as #sandbox', function() {
        var module = new Module(sandbox);
        
        expect(module.sandbox).toBe(sandbox);
      });


      it('assigns baseRoute option as #baseRoute', function() {
        var baseRoute = 'base/route',
            module = new Module(sandbox, { baseRoute: baseRoute });

        expect(module.baseRoute).toEqual(baseRoute);
      });


      it('assigns baseRouteName option as #baseRouteName', function() {
        var baseRouteName = 'base_route',
            module = new Module(sandbox, { baseRouteName: baseRouteName });

        expect(module.baseRouteName).toEqual(baseRouteName);
      });

    }); // constructor


    describe('prototype', function() {

      describe('#moduleFactory', function() {
        var subject, sandbox, moduleCtor;

        beforeEach(function() {
          sandbox = {
            moduleFactory: function() {}
          };
          moduleCtor = function() {};

          subject = new Module(sandbox);
        });

        it('creates a module with the moduleFactory provided via sandbox', function() {
          var spy = spyOn(sandbox, 'moduleFactory'),
              options = {};

          subject.moduleFactory(moduleCtor, options);

          expect(spy).toHaveBeenCalledWith(moduleCtor, options);
        });

        it('return the created module', function() {
          var ret = {}; 
          spyOn(sandbox, 'moduleFactory').andReturn(ret);

          expect(subject.moduleFactory(moduleCtor)).toBe(ret);
        });
      
      }); // #moduleFactory

      
      describe('#isRoutable', function() {
      
        describe('when baseRoute and baseRouteName property is set', function() {
        
          beforeEach(function() {
            subject.baseRoute = 'base/route';
            subject.baseRouteName = 'base_route';
          });

          it('returns true', function() {
            expect(subject.isRoutable()).toBe(true);
          });

        });

        it('should return false', function() {
          expect(subject.isRoutable()).toBe(false);
        }); 
      
      }); // #isRoutable


    }); // prototype


    describe('instance', function() {
      var subject, sandbox;

      beforeEach(function() {
        sandbox = {};
        subject = new Module(sandbox);
      });

      it('has no #router by default', function() {
        expect(subject.router).not.toBeDefined();
      });

    });


    it('extends core/core', function() {
      expect(new Module() instanceof ModularBase).toBe(true);
    });

  }); // core/module

});
