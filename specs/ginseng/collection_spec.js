require([
  'ginseng/collection',
  'backbone'
], function(
  Collection,
  Backbone
) {
  'use strict';

  describe('ginseng/collection', function() {
    
    it('should extend Backbone.Collection', function() {
      expect(new Collection() instanceof Backbone.Collection).toBe(true);
    });

  });

});
