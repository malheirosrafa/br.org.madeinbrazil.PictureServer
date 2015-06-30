var assert = require('chai').assert

describe('picture resource', function(){

  var pictureResource = require("../resource/picture");

  it('should have a get method', function () {
    assert.isFunction(pictureResource.get);
  })

  it('should have a create method', function () {
    assert.isFunction(pictureResource.create);
  })

})
