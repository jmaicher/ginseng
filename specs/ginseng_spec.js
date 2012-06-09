require([
  'ginseng',
  'underscore',
  'ginseng/core',
  'ginseng/module',
  'ginseng/model',
  'ginseng/view',
  'ginseng/collection'
], function(
  Ginseng,
  Underscore,
  Core,
  Module,
  Model,
  View,
  Collection
) {

  describe('ginseng', function() {
  
    it('exposes underscore.js under #_', function() {
      expect(Ginseng._).toBe(Underscore);
    });

    it('exposes ginseng/core under #Core', function() {
      expect(Ginseng.Core).toBe(Core);
    });

    it('exposes ginseng/module under #Module', function() {
      expect(Ginseng.Module).toBe(Module);
    });
 
    it('exposes ginseng/model under #Model', function() {
      expect(Ginseng.Model).toBe(Model);
    });

    it('exposes ginseng/view under #View', function() {
      expect(Ginseng.View).toBe(View);
    });

    it('exposes ginseng/collection under #Collection', function() {
      expect(Ginseng.Collection).toBe(Collection);
    });

  });

});
