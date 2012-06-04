require([
  'underscore',
  'ginseng/modular_base',
], function(_, ModularBase) {
  'use strict';

  describe('ginseng/modular_base', function() {
  
    describe('constructor', function() {
      var subject;

      beforeEach(function() {
        subject = new ModularBase();
      });

      describe('when router and routes object is defined', function() {
        var router, routes, route, routeName;

        beforeEach(function() {
          router = {
            route: function() {}
          };

          route = 'some/route';
          routeName = 'some_route';

          routes = {};
          routes[route] = routeName;

          // create clean subject with router and routes
          // we use an intermediate ctor here because we want
          // the prototype but we don't want to call the ctor
          // of ModularBase automatically.
          var Child = function() {};
          Child.prototype = ModularBase.prototype;
          subject = new Child();
          subject.router = router;
          subject.routes = routes;
        });

        it('creates the routes given in routes object', function() {
          var spy = spyOn(router, 'route');

          // invoke ctor on subject
          ModularBase.call(subject);
          
          expect(spy).toHaveBeenCalledWith(route, routeName);
        });

      });

      it('initializes modules property with empty array', function() {
        expect(subject.modules).toBeArray();
        expect(subject.modules.length).toBe(0);  
      }); 

      it('initializes loaded flag with false', function() {
        expect(subject.loaded).toBe(false);
      });

      it('initializes cold flag with false', function() {
        expect(subject.cold).toBe(true);
      });

      it('initializes options property with the given options', function() {
        var options = { key: 'val' };
        expect( (new ModularBase(options)).options ).toBe(options);
      });

      it('defines/redefines #load function which ensures that prototype function #_load and child function #load are both called when child implements it', function() {
        var protoSpy = spyOn(ModularBase.prototype, '_load'),
            Child = ModularBase.extend({
              load: function() {}
            }),
            childProtoSpy = spyOn(Child.prototype, 'load');

        new Child().load();

        expect(protoSpy).toHaveBeenCalled();
        expect(childProtoSpy).toHaveBeenCalled();
      });

      it('defines/redefines #unload function which ensures that prototype function #_unload and child function #unload are both called when child implements it', function() {
        var protoSpy = spyOn(ModularBase.prototype, '_unload'),
            Child = ModularBase.extend({
              unload: function() {}
            }),
            childProtoSpy = spyOn(Child.prototype, 'unload');

        new Child().unload();

        expect(protoSpy).toHaveBeenCalled();
        expect(childProtoSpy).toHaveBeenCalled();
      });

      it('defines/redefines #finalize function which ensures that prototype function #_finalize and child function #finalize are both called when child implements it', function() {
        var protoSpy = spyOn(ModularBase.prototype, '_finalize'),
            Child = ModularBase.extend({
              finalize: function() {}
            }),
            childProtoSpy = spyOn(Child.prototype, 'finalize');

        new Child().finalize();

        expect(protoSpy).toHaveBeenCalled();
        expect(childProtoSpy).toHaveBeenCalled();
      });


      it('invokes #initialize with given arguments', function() {
        var spy = spyOn(ModularBase.prototype, 'initialize');
        var args = { foo: 'bar' };
        new ModularBase(args);
        expect(spy).toHaveBeenCalledWith(args);
      });


    }); // constructor

    describe('prototype', function() {
      var subject;

      beforeEach(function() {
        subject = new ModularBase();
      });

      describe('#initialize', function() {
      
        it('is defined', function() {
          expect(ModularBase.prototype.initialize).toBeFunction(); 
        });

      }); // #initialize


      describe('#_load', function() { 
        
        describe('when cold flag is true', function() {
          
          beforeEach(function() {
            // just in case (true is default)
            subject.cold = true;
          });

          it('sets cold flag to false', function() {
            subject._load();
            expect(subject.cold).toBe(false);
          });

        });

        describe('when router is defined', function() {
          var router;

          beforeEach(function() {
            router = {
              start: function() {}
            };

            subject.router = router;
          });


          describe('when cold flag is true', function() {
       
            beforeEach(function() {
              // just in case (true is default)
              subject.cold = true;
              router.routes = [];  
              _.extend(router, Backbone.Events);
            });

            describe('when a route and a function with the corresponding route name exists', function() {
              var route, routeName;

              beforeEach(function() {
                route = 'some/route';
                routeName = 'some_route';

                router.routes = [{
                  route: route,
                  name: routeName
                }];

                subject[routeName] = function() {};
              }); 

              it('binds route event to the callback function', function() {
                var spy = spyOn(subject, routeName);

                subject._load();
                subject.router.trigger('route:' + routeName);

                expect(spy).toHaveBeenCalled();
              }); 

            });

            describe('when a route exists which is directly assigned to a module', function() {
              var route, routeName, module;

              beforeEach(function() {
                route = 'some/route';
                routeName = 'some_route';

                router.routes = [{
                  route: route,
                  name: routeName
                }];

                module = {};

                subject.modules.push({
                  ctor: function() {},
                  instance: module,
                  autoload: routeName
                });

              });

              it('creates callback for the route event which loads the module', function() {
                var spy = spyOn(subject, 'loadModule');

                subject._load();
                subject.router.trigger('route:' + routeName);

                expect(spy).toHaveBeenCalledWith(module);
              });

            });


            describe('when a route exists which has a baseRoute which is assigned to a module', function() {
              var baseRoute, baseRouteName, route, routeName, module;

              beforeEach(function() {
                baseRoute = 'base/route';
                baseRouteName = 'base_route';

                route = baseRoute + '/some/route';
                routeName = baseRouteName + '_some_route';

                router.routes = [{
                  route: baseRoute,
                  name: baseRouteName
                }, {
                  route: route,
                  name: routeName
                }];

                subject.modules.push({
                  ctor: function() {},
                  instance: module,
                  autoload: baseRouteName  
                });
              });

              it('creates callback for the route event which loads the module', function() {
                var spy = spyOn(subject, 'loadModule');

                subject._load();
                subject.router.trigger('route:' + routeName);

                expect(spy).toHaveBeenCalledWith(module);
              });

            });

          }); // when cold flag is true


          it('starts the router', function() {
            var spy = spyOn(router, 'start');

            subject._load();

            expect(spy).toHaveBeenCalled();
          });
        
        }); // when router is defined


        it('loads module when autoload = true', function() {
          var module, spy;
          
          module = {
            ctor: function() {},
            instance: {
              load: function() {}
            },
            autoload: true
          };
          
          spy = spyOn(module.instance, 'load');

          subject.modules.push(module);
          subject._load();

          expect(spy).toHaveBeenCalled();
        });


        it('does not load module when autoload = false', function() {
          var module, spy;
          
          module = {
            ctor: function() {},
            instance: {
              load: function() {}
            },
            autoload: false
          };
          
          spy = spyOn(module.instance, 'load');

          subject.modules.push(module);
          subject._load();

          expect(spy).not.toHaveBeenCalled();
        });

        it('does not load module when autoload is route', function() {
          var module, spy;
          
          module = {
            ctor: function() {},
            instance: {
              load: function() {}
            },
            autoload: 'some_route'
          };
          
          spy = spyOn(module.instance, 'load');

          subject.modules.push(module);
          subject._load();

          expect(spy).not.toHaveBeenCalled();
        });

        it('sets loaded flag to true', function() {
          subject._load();
          expect(subject.loaded).toBe(true);
        });

      }); // #load


      describe('#_unload', function() {

        describe('when router is defined', function() {
          var router;

          beforeEach(function() {
            router = {
              stop: function() {}
            };

            subject.router = router;
          });

          it('stops the router', function() {
            var spy = spyOn(router, 'stop');

            subject._unload();

            expect(spy).toHaveBeenCalled();
          });

        }); 

        it('unloads loaded modules', function() {
          var spy, module = {
            ctor: function() {},
            instance: {
              loaded: true,
              unload: function() {}
            },
            autoload: true
          };

          spy = spyOn(module.instance, 'unload');

          subject.modules.push(module);
          subject._unload();

          expect(spy).toHaveBeenCalled();
        });

        it('does not unload not loaded modules', function() {
          var spy, module = {
            ctor: function() {},
            instance: {
              loaded: false,
              unload: function() {}
            },
            autoload: true
          };

          spy = spyOn(module.instance, 'unload');

          subject.modules.push(module);
          subject._unload();

          expect(spy).not.toHaveBeenCalled();
        });

      }); // #_unload


      describe('#_finalize', function() {

        describe('when a module is loaded', function() {
          var module;

          beforeEach(function() {
            module = {
              ctor: function() {},
              instance: {
                loaded: true,
                unload: function() {},
                finalize: function() {}
              }
            };

            subject.modules.push(module);
          });

          it('unloads the module before it finalizes it', function() {
            var unloadSpy = spyOn(module.instance, 'unload'),
                finalizeSpy = spyOn(module.instance, 'finalize');

            subject._finalize();

            expect(unloadSpy).toHaveBeenCalled();
            expect(finalizeSpy).toHaveBeenCalled();
          });
        }); // when a module is loaded

        it('finalizes all modules', function() {
          var spy, module = {
            ctor: function() {},
            instance: {
              loaded: false,
              finalize: function() {}
            },
            autoload: true
          };

          spy = spyOn(module.instance, 'finalize');

          subject.modules.push(module);
          subject._finalize();

          expect(spy).toHaveBeenCalled();
        });

      }); // #_finalize


      describe('#addModule', function() {
        var moduleCtor, moduleOptions, moduleInstance, moduleFactorySpy;
        
        beforeEach(function() {
          moduleCtor = function() {};
          moduleOptions = { foo: 'bar' };
          moduleInstance = new moduleCtor();
          moduleFactorySpy = spyOn(subject, 'moduleFactory').andReturn(moduleInstance);
        });

        it('throws error when typeof moduleCtor argument is not function', function() {
          expect( function() { subject.addModule('not a function') } ).toThrow();
        });

        it('throws error when typeof moduleOptions argument is not  object', function() {
          expect( function() { subject.addModule(moduleCtor, 'not an Object') } ).toThrow();
        });

        it('throws error when typeof autoload argument is not boolean or string', function() {
          expect( function() { subject.addModule(moduleCtor, moduleOptions, 23) } ).toThrow();
        });

        it('throws error when autoload is route and #router is null', function() {
          subject.router = null;
          expect( function() { subject.addModule(moduleCtor, moduleOptions, 'route') } ).toThrow();
        });

        it('uses #moduleFactory to create a new module from given moduleCtor', function() {
          subject.addModule(moduleCtor);
          expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, {});
        }); 

        it('passes given moduleOptions to #moduleFactory', function() {
          subject.addModule(moduleCtor, moduleOptions);
          expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, moduleOptions);
        });

        it('removes baseRoute and baseRouteName property from moduleOptions when added manually and autoload is not a route', function() {
          var dirtyModuleOptions = _.clone(moduleOptions),
              cleanModuleOptions = moduleOptions;

          dirtyModuleOptions.baseRoute = 'base/route';
          dirtyModuleOptions.baseRouteName = 'base_route';
          
          subject.addModule(moduleCtor, dirtyModuleOptions, true);
          expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, cleanModuleOptions);
        });

        it('adds module instance with moduleCtor and autoload argument to modules array', function() {
          var autoload = true;
          
          subject.addModule(moduleCtor, moduleOptions, autoload);

          expect(subject.modules.pop()).toEqual({
            ctor: moduleCtor,
            instance: moduleInstance,
            autoload: autoload
          });

        });

        it('returns the created module instance', function() {
          expect( subject.addModule(moduleCtor) ).toBe(moduleInstance);
        });
        
        describe('when autoload is route and #router is defined', function() {
          var router, route, routeName, routes, moduleRoutes;

          beforeEach(function() {
            // setup router stub
            router = {
              hasRoute: function() {},
              getRoute: function() {},
              route: function() {}
            };
            route = 'some/route';
            routeName = 'some_route';

            spyOn(router, 'hasRoute').andReturn(true);
            spyOn(router, 'getRoute').andReturn(route);

            subject.router = router;

            moduleRoutes = [];
            moduleInstance.getRoutes = function() {};
            spyOn(moduleInstance, 'getRoutes').andReturn(moduleRoutes);
          });

          it('adds baseRoute and baseRouteName to moduleOptions', function() {
            var moduleOptionsWithBaseRouteOptions = _.clone(moduleOptions);

            // add expected baseUrl to expected moduleOptions
            moduleOptionsWithBaseRouteOptions.baseRoute = route;
            moduleOptionsWithBaseRouteOptions.baseRouteName = routeName;

            subject.addModule(moduleCtor, moduleOptions, routeName);
            expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, moduleOptionsWithBaseRouteOptions);
          });

          it('adds routes defined by the created module instance with relative route prefix to the router of this module', function() {
            var spy = spyOn(router, 'route'),
                moduleRoute = 'module/route',
                moduleRouteName = 'module_route',
                prefixedRoute = route + '/' + moduleRoute,
                prefixedRouteName = routeName + '_' + moduleRouteName;

            // hasRoute is spy but returns true by default
            // => it should return false when checking for module routes
            router.hasRoute.andCallFake(function(routeName) {
              return routeName === prefixedRouteName ? false : true;
            });

            // create module routes
            moduleInstance.getRoutes.andReturn([{
              route: moduleRoute,
              name: moduleRouteName
            }]);

            subject.addModule(moduleCtor, moduleOptions, routeName);

            expect(spy).toHaveBeenCalledWith(prefixedRoute, prefixedRouteName, false)
          });

          describe('when module defines root url', function() {
          
            it('adds routes defined by the created module instance with relative route prefix to the router of this module', function() {
              var spy = spyOn(router, 'route'),
                  moduleRoute = '',
                  moduleRouteName = 'module_root';

              // hasRoute is spy but returns true by default
              // => it should return false when checking for module routes
              router.hasRoute.andCallFake(function(routeName) {
                return routeName === routeName ? true : false;
              });

              // create module routes
              moduleInstance.getRoutes.andReturn([{
                route: moduleRoute,
                name: moduleRouteName
              }]);

              subject.addModule(moduleCtor, moduleOptions, routeName);

              expect(spy).not.toHaveBeenCalled();
            });

          }); // when module defines root url

          describe('when router has baseRoute and baseRouteName', function() {
            var baseRoute, baseRouteName;

            beforeEach(function() {
              router.baseRoute = baseRoute = 'base/route';
              router.baseRouteName = baseRouteName = 'base_route';
            });

            it('adds prefixed baseRoute and baseRouteName to moduleOptions', function() {
              var moduleOptionsWithBaseRouteOptions = _.clone(moduleOptions);

              // add expected baseUrl to expected moduleOptions
              moduleOptionsWithBaseRouteOptions.baseRoute = baseRoute + '/' + route;
              moduleOptionsWithBaseRouteOptions.baseRouteName = baseRouteName + '_' + routeName;

              subject.addModule(moduleCtor, moduleOptions, routeName);
              expect(moduleFactorySpy).toHaveBeenCalledWith(moduleCtor, moduleOptionsWithBaseRouteOptions);
            });

          });

          describe('when route is not defined within routes property', function() {
            
            beforeEach(function() {
              // hasRoute is already spy
              router.hasRoute.andReturn(false);
            });
            
            it('throws error', function() {
              expect( function() { subject.addModule(moduleCtor, {}, routeName) } ).toThrow();
            });

          }); // route is not defined

        }); // autoload is route and #router is defined
       
      }); // #addModule


      describe('#loadModule', function() {
        var module;

        beforeEach(function() {
          module = {
            isRoutable: function() {},
            load: function() {}
          }

          spyOn(module, 'isRoutable').andReturn(false);
        });

        describe('when given module is routable', function() {
          var anotherModule, unloadSpy;

          beforeEach(function() {
            module.isRoutable.andReturn(true);

            anotherModule = {
              unload: function() {}
            };

            unloadSpy = spyOn(anotherModule, 'unload');
          });

          it('unloads routable modules which are loaded', function() {
            anotherModule.loaded = true;
            subject.modules.push({
              ctor: function() {},
              instance: anotherModule,
              autoload: 'some_route'
            });

            subject.loadModule(module);

            expect(unloadSpy).toHaveBeenCalled();
          });

          it('does not unload routable modules which are not loaded', function() {
            anotherModule.loaded = false;
            subject.modules.push({
              ctor: function() {},
              instance: anotherModule,
              autoload: 'some_route'
            });

            subject.loadModule(module);

            expect(unloadSpy).not.toHaveBeenCalled();
          });

          it('does not unload modules which are loaded but not routable', function() {
            anotherModule.loaded = true;
            subject.modules.push({
              ctor: function() {},
              instance: anotherModule,
              autoload: true
            });

            subject.loadModule(module);

            expect(unloadSpy).not.toHaveBeenCalled();
          });

        }); // when given module is routable
        

        describe('when the given module is loaded', function() {
          
          beforeEach(function() {
            module.loaded = true;
          });

          it('does not load the module again', function() {
            var spy = spyOn(module, 'load');

            subject.loadModule(module);

            expect(spy).not.toHaveBeenCalled();
          });

        }); // then the given module is loaded


        it('loads the given module', function() {
          var spy = spyOn(module, 'load');

          subject.loadModule(module);

          expect(spy).toHaveBeenCalled();
        });

      }); // #loadModule


      describe('#getRoutes', function() {
        var router;

        beforeEach(function() {
          router = {
            getRoute: function() {}
          };
          router.routes = [{
            route: 'some/route',
            name: 'some_route'
          }];
          subject.router = router;
        });

        it('returns clone of #router#routes when router is defined', function() {
          expect(subject.getRoutes()).toEqual(router.routes);
        });

        it('returns empty array when router is not defined', function() {
          subject.router = undefined;
          expect(subject.getRoutes()).toEqual([]);
        });

      }); // #getRoutes


      describe('hasRoutes', function() {
        var router;

        beforeEach(function() {
          router = {
            getRoute: function() {}
          };
          router.routes = [{
            route: 'some/route',
            name: 'some_route'
          }];
          subject.router = router;
        });

        it('returns true when router has routes', function() {
          expect(subject.hasRoutes()).toBe(true);
        });

        it('returns false when router has not routes', function() {
          subject.router.routes = [];
          expect(subject.hasRoutes()).toBe(false);
        });
     
        it('returns false when router is not defined', function() {
          subject.router = undefined;
          expect(subject.hasRoutes()).toBe(false);
        });

      }); // #hasRoutes

      it('is event dispatcher', function() {
        expect(ModularBase.prototype).toBeEventDispatcher();
      });

      it('is mixable', function() {
        expect(ModularBase.prototype).toBeMixable();
      });
  
    }); // prototype

    it('is extendable', function() {
      expect(ModularBase).toBeExtendable();
    });

    it('is mixable', function() {
      expect(ModularBase).toBeMixable();
    });
  
  }); // core/core

}); // require
