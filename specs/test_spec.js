require(['test'], function(test) {

  describe('test', function() {

    it('should be true', function() {
      expect(test.sayHello()).toEqual("Hello World");
    });

  });

});
