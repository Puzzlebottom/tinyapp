const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

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

describe('getUserEmail when it is not passed a valid argument', function() {
  it('should throw an error if passed the wrong number of arguments', function() {
    const tooManyArguments = () => getUserByEmail(testUsers, 'userRandomID', 'extraArgument');
    const notEnoughArguments = () => getUserByEmail(testUsers);

    assert.throw(tooManyArguments, 'Error: too many arguments');
    assert.throw(notEnoughArguments, 'Error: not enough arguments');
  });

  it('should throw an error if the argument passed is not the correct type', function() {
    const notObject = () => getUserByEmail('notAnObject', 'name@email.com');
    const notString = () => getUserByEmail(testUsers, ['not a string']);

    assert.throw(notObject, 'Error: invalid argument type');
    assert.throw(notString, 'Error: invalid argument type');
  });

  it('should throw an error if the argument is not formated as a vaild email address', function() {
    const invalidEmail1 = () => getUserByEmail(testUsers, '@gmail.com');
    const invalidEmail2 = () => getUserByEmail(testUsers, 'namegmail.com');
    const invalidEmail5 = () => getUserByEmail(testUsers, 'name@.com');
    const invalidEmail3 = () => getUserByEmail(testUsers, 'name@gmailcom');
    const invalidEmail4 = () => getUserByEmail(testUsers, 'name@gmail.');

    assert.throw(invalidEmail1, 'Error: not a valid email address');
    assert.throw(invalidEmail2, 'Error: not a valid email address');
    assert.throw(invalidEmail3, 'Error: not a valid email address');
    assert.throw(invalidEmail4, 'Error: not a valid email address');
    assert.throw(invalidEmail5, 'Error: not a valid email address');
  });
});

describe('getUserByEmail when passed an email that does not exist in the user database', function() {
  it('should return undefined', function() {
    const result = getUserByEmail(testUsers, 'fake@emale.org');
    assert.isUndefined(result);
  });
});

describe('getUserByEmail when passed an email that exists in the user database', function() {
  it('should return a user', function() {
    const user = getUserByEmail(testUsers, 'user@example.com');
    const expectedKeys = ['id', 'email', 'password'];

    assert.containsAllKeys(user, expectedKeys);
  });

  it('should return a user whose email matches the one provided', function() {
    const user = getUserByEmail(testUsers, 'user@example.com');
    const expectedEmail = 'user@example.com';
    assert.equal(user.email, expectedEmail);
  });
});