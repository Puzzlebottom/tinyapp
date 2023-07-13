const { assert } = require('chai');
const { generateRandomString } = require('../public/scripts/helpers.js');
const { ALPHANUMERIC_CHARS } = require('../public/scripts/constants.js');


const testIDs = {
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

describe('generateRandomString when it is not passed a valid argument', function() {
  it('should throw an error if passed the wrong number of arguments', function() {
    const tooManyArguments = () => generateRandomString(testIDs, 6, 'extra argument');
    const notEnoughArguments = () => generateRandomString();

    assert.throw(tooManyArguments, 'Error: too many arguments');
    assert.throw(notEnoughArguments, 'Error: not enough arguments');
  });

  it('should throw an error if the argument passed is not the correct type', function() {
    const notObject = () => generateRandomString('notAnObject', 6);
    const notNumber = () => generateRandomString(testIDs, '6');

    assert.throw(notObject, 'Error: invalid argument type');
    assert.throw(notNumber, 'Error: invalid argument type');
  });
});

describe('generateRandomString when it is passed a valid argument', function() {
  it('should return a string', function() {
    assert.isString(generateRandomString(testIDs, 6));
  });

  it('should return a string whose length matches the stringLength argument', function() {
    const resultLength = generateRandomString(testIDs, 42).length;

    assert.equal(resultLength, 42);
  });

  it('should return a string that does not already exist in the database', function() {
    const veryLimitedOptions = {};
    for (const char of ALPHANUMERIC_CHARS) {
      veryLimitedOptions[char] = null;
    }
    delete veryLimitedOptions['Z'];

    const result1 = generateRandomString(veryLimitedOptions, 1);
    const result2 = generateRandomString(veryLimitedOptions, 1);
    const result3 = generateRandomString(veryLimitedOptions, 1);
    const result4 = generateRandomString(veryLimitedOptions, 1);

    assert.equal(result1, 'Z'); // 1 in 62 chance of false positive...
    assert.equal(result2, 'Z'); // 1 in 3844 chance..
    assert.equal(result3, 'Z'); // 1 in 238328...
    assert.equal(result4, 'Z'); // 1 in 14776336. I'm okay with that.
  });
});