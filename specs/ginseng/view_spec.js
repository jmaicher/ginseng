require([
  'ginseng/view',
  'backbone'
], function(
  View,
  Backbone
) {
  'use strict';

  describe('ginseng/view', function() {

    it('should extend Backbone.View', function() {
      expect(new View() instanceof Backbone.View).toBe(true);
    });

  });

});
