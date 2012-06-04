require([
  'ginseng/mixins/extendable'
], function(
  Extendable
) {
  'use strict';

  describe('ginseng/mixins/extendable', function() {

    // Note: extend is just a wrapper around InheritanceHelpers.extend
    // and the functionality of this function has been tested. 
    it('provides extend function', function() {
      expect(typeof Extendable.extend).toBe('function');
    });
  
  }); // Extendable

});
