define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  'use strict';

  var ModuleRouter = function(options) {
    // default arguments
    options || (options = {});

    this._extractOptions(options);
   
    // create empty routes array
    this.routes = [];
  };

  _.extend(ModuleRouter.prototype, Backbone.Events, {

    _extractOptions: function(options) {
      // argument validation
      if(!options.router) {
        throw new Error('options argument must have router property'); 
      };
      if(!options.baseRoute) {
        throw new Error('options argument must have baseRoute property');
      };
      if(!options.baseRouteName) {
        throw new Error('options argument must have baseRouteName property');
      };

      this.router = options.router;
      this.baseRoute = options.baseRoute;
      this.baseRouteName = options.baseRouteName;
    },

    route: function(route, routeName, create) {
      // default arguments
      create = ( create === undefined ) ? true : create;

      this.routes.push({
        route: route,
        name: routeName
      });
      
      // when route is '' => we don't need to create it again
      // because it must have been created by parent module
      if(create && route) {
        route = this.baseRoute + '/' + route;
        routeName = this.baseRouteName + '_' + routeName;

        this.router.route(route, routeName);
      }

      return this;
    },

    hasRoute: function(routeName) {
      return _.any(this.routes, function(route) {
        return route.name === routeName;
      });
    },

    getRoute: function(routeName) {
      var route = _.find(this.routes, function(route) {
        return route.name === routeName;
      });

      return (route) ? route.route : route;
    },

    navigate: function(fragment, options) {
      fragment = this.baseRoute + '/' + fragment;
      this.router.navigate(fragment, options);
    },

    start: function() {
      _.each(this.routes, function(route) {
        this.router.on('route:' + this.baseRouteName + '_' + route.name, function() {
          this.trigger('route:' + route.name);
        }, this);
      }, this);

      this._loadFragment(this._getCurrentUrlFragment());
    },

    stop: function() {
      // remove all callbacks from this router instance
      this.router.off(null, null, this);
    },

    /*
     * Returns the current absolute url fragment
     */
    _getCurrentUrlFragment: function() {
      return Backbone.history.fragment;
    },

    /*
     * Checks absolute url fragment and triggers route event
     * when match with relative routes has been found.
     */
    _loadFragment: function(fragment) {
      var matched = _.any(this.routes, function(route) {
        var fragmentRegExp = new RegExp(fragment + '$');
        // when route.route is empty => it's the root route
        var absoluteRoute = route.route ? this.baseRoute + '/' + route.route : this.baseRoute;
        if(fragmentRegExp.test( absoluteRoute )) {
          this.trigger('route:' + route.name);
          return true;
        }
      }, this);

      return matched;      
    }

  });

  return ModuleRouter;

});
