const { assert } = require('chai');
const { logVisit } = require('../helpers');


describe('logVisit when it is given invalid arguments', function() {
  it('should throw an error if given the wrong number of arguments', function() {
    const tooManyArguments = () => logVisit({}, 'urlRandomID', 'visitorRandomID', 'extra argument');
    const notEnoughArguments = () => logVisit();

    assert.throw(tooManyArguments, 'Error: too many arguments');
    assert.throw(notEnoughArguments, 'Error: not enough arguments');
  });

  it('should throw an error if given arguments of the wrong type', function() {
    const notObject = () => logVisit('not an object', 'urlRandomID', 'visitorRandomID');
    const notString1 = () => logVisit({}, ['not a string'], 'visitorRandomID');
    const notString2 = () => logVisit({}, 'urlRandomID', ['not a string']);

    assert.throw(notObject, 'Error: invalid argument type');
    assert.throw(notString1, 'Error: invalid argument type');
    assert.throw(notString2, 'Error: invalid argument type');
  });
});

describe('log visit when it is given valid arguments', function() {
  const testUrls = {
    urlRandomID: {
      longURL: 'http://www.example.com',
      userID: 'userRandomID',
      visits: {
        total: 0,
        unique: 0,
        visitors: [],
        logs: [],
      }
    }
  };

  const url = testUrls['urlRandomID'];

  it('should increase the urls total visits by 1', function() {
    assert.increases(() => logVisit(testUrls, 'urlRandomID', 'visitorRandomID'), url.visits, 'total');
  });

  it('should increase the urls unique visits by 1 if the the visitor is new', function() {
    assert.equal(url.visits.unique, 1);
  });

  it('should add the visitorID to the visitors list if the visitor is new', function() {
    assert.deepEqual(url.visits.visitors, ['visitorRandomID']);
  });

  logVisit(testUrls, 'urlRandomID', 'visitorRandomID');

  it('should not increase the urls unique visits if the visitor is not new', function() {
    assert.equal(url.visits.unique, 1);
  });

  it('should not add the visitorID to the visitors list if the visitor is not new', function() {
    assert.equal(url.visits.visitors.length, 1);
  });

  it('should add a log entry containing the visitorID and a timeStamp', function() {
    assert.equal(url.visits.logs.length, 2);
  });

});