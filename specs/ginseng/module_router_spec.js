require([
  'underscore',
  'backbone',
  'ginseng/module_router'  
], function(_, Backbone, ModuleRouter) {
  'use strict';
  
  describe('ginseng/module_router', function() {
    var subject, router, baseRoute, baseRouteName;

    beforeEach(function() {
      // create router instance for module router
      router = {
        route: function() {},
        navigate: function() {}
      };
      // routers are event dispatcher
      _.extend(router, Backbone.Events);

      baseRoute = "base/route";
      baseRouteName = "base_name";

      subject = new ModuleRouter({
        router: router,
        baseRoute: baseRoute,
        baseRouteName: baseRouteName
      });
    });


    describe('constructor', function() {

      it('throws error when options argument does not have router property', function() {
        expect( function() { new ModuleRouter({ baseRoute: baseRoute, baseRouteName: baseRouteName }) } ).toThrow();
      }); 

      it('throws error when options argument does not have baseRoute property', function() {
        expect( function() { new ModuleRouter({ router: router, baseRouteName: baseRouteName }) } ).toThrow();
      });

      it('throws error when options argument does not have baseRouteName property', function() {
        expect( function() { new ModuleRouter({ router: router, baseRoute: baseRoute }) } ).toThrow();
      }); 

      it('assigns given router as subject variable', function() {
        expect(subject.router).toBe(router);
      });

      it('assigns given baseRoute as subject variable', function() {
        expect(subject.baseRoute).toBe(baseRoute);
      });

      it('assigns given baseRouteName as subject variable', function() {
        expect(subject.baseRouteName).toBe(baseRouteName);
      });

    }); // #constructor

    describe('prototype', function() {

      describe('#route', function() {
        var route, routeName, callback;

        beforeEach(function() {
          route = 'relative/route';
          routeName = 'relative_route';
        });

        describe('when create arguments is false', function() {

          it('adds route representation to routes array', function() {
            subject.route(route, routeName, false);

            expect( subject.routes.pop() ).toEqual({
              route: route,
              name: routeName
            });
          });

          it('does not forward call to #router#route', function() {
            var spy = spyOn(router, 'route');

            subject.route(route, routeName, false);

            expect(spy).not.toHaveBeenCalled();
          });
       
        });
        
        it('prepends route with #baseRoute and routeName with #baseRouteName and forwards route and routeName to #router#route', function() {
          var spy = spyOn(router, 'route');
          
          subject.route(route, routeName);
          
          expect(spy).toHaveBeenCalledWith(subject.baseRoute + '/' + route, subject.baseRouteName + '_' + routeName);
        });

        it('adds route representation to routes array', function() {
          subject.route(route, routeName);

          expect( subject.routes.pop() ).toEqual({
            route: route,
            name: routeName
          });
        });

        it('returns this', function() {
          expect( subject.route(route, routeName) ).toBe(subject);
        });

      }); // #route


      describe('#hasRoute', function() {
        var route, routeName;

        beforeEach(function() {
          route =  'relative/route';
          routeName = 'relative_route';  
        });

        it('returns true when routes array contains route with given routeName', function() {
          subject.routes.push({
            route: route,
            name: routeName
          });

          expect( subject.hasRoute(routeName) ).toBe(true);
        });

        it('returns false when routes array does not contain route with given routeName', function() {
          expect( subject.hasRoute(routeName) ).toBe(false);
        });
      
      }); // #hasRoute

      
      describe('#getRoute', function() {
        var routeObject, route, routeName;

        beforeEach(function() {
          route = 'relative/route';
          routeName = 'relative_route';
        });

        it('returns route when routes array contains route with given routeName', function() {
          subject.routes.push({
            route: route,
            name: routeName
          });
          
          expect( subject.getRoute(routeName) ).toEqual(route)
        });

        it('returns null when route with given routeName does not', function() {
          expect( subject.getRoute('new_route') ).toBe(undefined); 
        });

      }); // #getRoute


      describe('#navigate', function() {
      
        it('prepends fragment with #baseRoute and forwards fragment and options to #router#navigate', function() {
          var spy = spyOn(router, 'navigate'),
              fragment = 'relative/route',
              options = { trigger: true };

          subject.navigate(fragment, options);

          expect(spy).toHaveBeenCalledWith(subject.baseRoute + '/' + fragment, options);
        });

      }); // #navigate


      describe('#start', function() {
        var route, routeName, _getCurrentUrlFragmentSpy;

        beforeEach(function() {
          // create relative module route
          route = 'relative/route';
          routeName = 'relative_route';
          subject.routes.push( { route: route, name: routeName } );

          // set url fragment by stubbing out getter method
          _getCurrentUrlFragmentSpy = spyOn(subject, '_getCurrentUrlFragment').andReturn('no/matching/url/fragment');
        });

        afterEach(function() {
          
        });

        it('binds absolute route callbacks to #router for all relative routes which will trigger relative route events', function() {
          var spy = jasmine.createSpy('relative route callback');
          subject.on('route:' + routeName, spy);

          subject.start();
          
          // trigger route event manually to check if subject triggers relative route event
          subject.router.trigger('route:' + subject.baseRouteName + '_' + routeName);

          expect(spy).toHaveBeenCalled();
        });

        it('checks current url fragment and triggers relative route event when match with relative routes has been found', function() {
          var matchingFragment = subject.baseRoute + '/' + route;
          _getCurrentUrlFragmentSpy.andReturn(matchingFragment);

          var spy = jasmine.createSpy('relative route callback');
          subject.on('route:' + routeName, spy);

          subject.start();

          expect(spy).toHaveBeenCalled();
        });

        it('triggers only relative route event when relative route is postfix of current url fragment', function() {
          var infixMatchingFragment = subject.baseRoute + '/' + route + '/postfix';
          _getCurrentUrlFragmentSpy.andReturn(infixMatchingFragment);

          var spy = jasmine.createSpy('relative route callback');
          subject.on('route:' + routeName, spy);

          subject.start();

          expect(spy).not.toHaveBeenCalled();
        });

      }); // #start


      describe('#stop', function() {

        beforeEach(function() {
          _.extend(router, Backbone.Events);
        });

        it('removes all callbacks from #router for router context', function() {
          var spy = jasmine.createSpy('callback with router context');
          subject.router.on( 'event', spy, subject );

          subject.stop();

          subject.router.trigger('event');
          expect(spy).not.toHaveBeenCalled();
        });

        it('does not remove callbacks from different contexts', function() {
          var spy = jasmine.createSpy('callback with different context');
          subject.router.on( 'event', spy );

          subject.stop();

          subject.router.trigger('event');
          expect(spy).toHaveBeenCalled();
        });

      }); // #stop

      describe('#loadFragment', function() {
      
         

      }); 

    }); // prototype
    

    it('is event dispatcher', function() {
      expect(subject).toBeEventDispatcher();    
    });

    it('has empty routes array', function() {
      expect(subject.routes).toEqual([]);
    });
 
  }); // core/module_router

});
