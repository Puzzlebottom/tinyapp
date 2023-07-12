const { assert } = require('chai');
const { logVisit } = require('../helpers');

describe('logVisit when it is given invalid arguments', function() {
  it('should throw an error if given the wrong number of arguments');
  it('should throw an error if given arguments of the wrong type');
});

describe('log visit when if is given valid arguments', function() {
  it('should increase the urls total visits by 1');
  it('should increase the urls unique visits by 1 if the the visitor is new');
  it('should add the visitorID to the visitors list if the visitor is new');
  it('should not increase the urls unique vistits if the visitor is not new');
  it('should not add the visitorID to the visitors list if the visitor is not new');
  it('should add a log entry containing the visitorID and a timeStamp');

});