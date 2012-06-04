require([
  'ginseng/model',
  'backbone'
], function(
  Model,
  Backbone
) {
  'use strict';

  describe('ginseng/model', function() {

    it('should extend Backbone.Model', function() {
      expect(new Model() instanceof Backbone.Model).toBe(true);
    });

  });

});
