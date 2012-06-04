/**
 * A module that provides a Router constructor.
 *
 * @module lib/router
 * @require backbone
 */
define(['backbone'], function(Backbone) {
  'use strict';

  /**
   * Creates a router with given options.
   * This constructor extends Backbone.Router.
   *
   * @constructor
   *
   * @param {object} [options] - options hash with router options
   */
  var exports = Backbone.Router.extend({

    constructor: function() {
      this.routes = []; 
    },

    route: function(route, routeName, create) {
      // default arguments
      create = ( create === undefined ) ? true : create;

      // argument validation
      if(this.hasRoute(routeName)) {
        throw new Error('route with name "' + routeName + '" is already defined');
      }
      
      this.routes.push({
        route: route,
        name: routeName
      });
  
      if(create) {
        Backbone.Router.prototype.route.call(this, route, routeName); 
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

    start: function() {
     if(!Backbone.history) return;
     
     Backbone.history.start({ pushState: true });
    },

    stop: function() {
      if(!Backbone.history) return;

      Backbone.history.stop();
    }
 
  });

  return exports;
});
