const { assert } = require('chai');
const { urlsForUser } = require('../public/scripts/helpers.js');

const testUsers = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

const testUrls = {
  urlRandomID: {
    longURL: 'http://www.example.com',
    userID: 'userRandomID'
  },
  url2RandomID: {
    longURL: 'http://www.anotherexample.com',
    userID: 'userRandomID'
  }
};

describe('urlsForUser when it is not passed a valid argument', function() {
  it('should throw an error if passed the wrong number of arguments', function() {
    const tooManyArguments = () => urlsForUser(testUrls, testUsers, 'userRandomID', 'extra argument');
    const notEnoughArguments = () => urlsForUser(testUrls, testUsers);

    assert.throw(tooManyArguments, 'Error: too many arguments');
    assert.throw(notEnoughArguments, 'Error: not enough arguments');
  });

  it('should throw an error the argument passed is not the correct type', function() {
    const notObject1 = () => urlsForUser('notAnObject', testUsers, 'userRandomID');
    const notObject2 = () => urlsForUser(testUrls, 'notAnObject', 'userRandomID');
    const notString = () => urlsForUser(testUrls, testUsers, ['userRandomID']);

    assert.throw(notObject1, 'Error: invalid argument type');
    assert.throw(notObject2, 'Error: invalid argument type');
    assert.throw(notString, 'Error: invalid argument type');
  });
});

describe('urlsForUser when it is passed an id not found in the database', function() {
  it('should throw an error', function() {
    const notInDatabase = () => urlsForUser(testUrls, testUsers, 'not in database');

    assert.throw(notInDatabase, "Error: User 'not in database' does not exist");
  });
});

describe('urlsForUser when it is passed an id for a user in the database', function() {
  it('should return an object', function() {
    const result = urlsForUser(testUrls, testUsers, 'userRandomID');

    assert.isObject(result);
  });

  it('should return an empty object if the user owns no urls', function() {
    const result = urlsForUser(testUrls, testUsers, 'user2RandomID');

    assert.isEmpty(result);
  });

  it('should return an array containing all urls owned by the user', function() {
    const result = urlsForUser(testUrls, testUsers, 'userRandomID');
    const expectedKeys = ['urlRandomID', 'url2RandomID'];

    assert.containsAllKeys(result, expectedKeys);
  });

  it('should return no urls not owned by the user', function() {
    const result = urlsForUser(testUrls, testUsers, 'user2RandomID');
    const unexpectedKeys = ['urlRandomID', 'url2RandomID'];

    assert.doesNotHaveAnyKeys(result, unexpectedKeys);
  });
});