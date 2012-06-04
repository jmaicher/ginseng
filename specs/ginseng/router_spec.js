require([
  'ginseng/router',
  'backbone'
], function(
  Router,
  Backbone
) {
  'use strict';

  describe('ginseng/router', function() {

    describe('constructor', function() {

      it('should not call Backbone.Router constructor', function() {
        var spy = spyOn(Backbone, 'Router');

        new Router();

        expect(spy).not.toHaveBeenCalled();  
      });
      
      it('initializes routes property as empty array', function() {
        var subject = new Router();

        expect(subject.routes).toBeArray();
        expect(subject.routes.length).toBe(0);
      });

    });

    describe('prototype', function() {
      var subject;

      beforeEach(function() {
        subject = new Router;
      });

      describe('#route', function() {
        var route, routeName;

        beforeEach(function() {
          route = 'some/route';
          routeName = 'some_route';
        });

        describe('when route with routeName already exists', function() {
          
          beforeEach(function() {
            subject.routes.push({
              route: route,
              name: routeName
            });
          });

          it('throws error', function() {
            expect( function() { subject.route(route, routeName) } ).toThrow();
          });

        });

        describe('when create argument is false', function() {
        
          it('adds route representation to routes array', function() {
            subject.route(route, routeName, false);
            expect( subject.routes.pop() ).toEqual({
              route: route,
              name: routeName
            });
          });

          it('does not forward call to Backbone.Router.prototype.route', function() {
            var spy = spyOn(Backbone.Router.prototype, 'route');

            subject.route(route, routeName, false);

            expect(spy).not.toHaveBeenCalledWith(route, routeName);
          });


        });

        it('adds route representation to routes array', function() {
          subject.route(route, routeName);
          expect( subject.routes.pop() ).toEqual({
            route: route,
            name: routeName
          });
        });

        it('forwards call to Backbone.Router.prototype.route', function() {
          var spy = spyOn(Backbone.Router.prototype, 'route');

          subject.route(route, routeName);

          expect(spy).toHaveBeenCalledWith(route, routeName);
        });

        it('returns this', function() {
          expect( subject.route(route, routeName) ).toBe(subject);
        });

      }); // #route

      describe('#hasRoute', function() {
        var route, routeName;

        beforeEach(function() {
          route = 'some/route';
          routeName = 'some_route';  
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
          route = 'some/route';
          routeName = 'some_route';
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

      describe('#start', function() {
        var history, _history;

        beforeEach(function() {
          // preserve global Backbone.history object
          _history = Backbone.history;

          history = {
            start: function() {}
          };

          Backbone.history = history;
        });

        afterEach(function() {
          // restore global Backbone.history object
          Backbone.history = _history;
        });
     
        describe('when Backbone.history is undefined', function() {
          beforeEach(function() {
            Backbone.history = undefined;
          });

          it('does not fail', function() {
            subject.start();
          }); 

        });

        it('starts Backbone.history with pushState', function() {
          var spy = spyOn(Backbone.history, 'start');

          subject.start();

          expect(spy).toHaveBeenCalledWith({ pushState: true });
        });

      }); // #start

      describe('#stop', function() {
        var history, _history;

        beforeEach(function() {
          // preserve global Backbone.history object
          _history = Backbone.history;

          history = {
            stop: function() {}
          };

          Backbone.history = history;
        });

        afterEach(function() {
          // restore global Backbone.history object
          Backbone.history = _history;
        });
     
        describe('when Backbone.history is undefined', function() {
          beforeEach(function() {
            Backbone.history = undefined;
          });

          it('does not fail', function() {
            subject.stop();
          }); 

        });

        it('stops Backbone.history', function() {
          var spy = spyOn(Backbone.history, 'stop');

          subject.stop();

          expect(spy).toHaveBeenCalled();
        });

     
      }); // #stop

    }); // prototype

    it('should extend Backbone.Router', function() {
      expect(new Router() instanceof Backbone.Router).toBe(true);
    });
 
  });

})
