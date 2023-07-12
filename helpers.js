const { ALPHANUMERIC_CHARS, EMAIL_VALIDATION_REGEX } = require('./constants');

const generateRandomString = (urlDatabase, stringLength) => {
  const totalNumberOfChars = ALPHANUMERIC_CHARS.length;
  let randomString = '';
  for (let i = 1; i <= stringLength; i++) {
    const randomIndex = Math.floor(Math.random() * totalNumberOfChars);
    randomString += ALPHANUMERIC_CHARS[randomIndex];
  }
  const alreadyExists = Object.keys(urlDatabase).includes(randomString);
  return alreadyExists ? generateRandomString(urlDatabase, stringLength) : randomString;
};

const getUserByEmail = function(users, email) {
  if (arguments.length > 2) throw new Error('Error: too many arguments');
  if (arguments.length < 2) throw new Error('Error: not enough arguments');
  if (typeof users !== 'object' || typeof email !== 'string') throw new Error('Error: invalid argument type');
  if (!EMAIL_VALIDATION_REGEX.test(email)) throw new Error('Error: not a valid email address');

  for (const user of Object.values(users)) {
    if (user.email === email) return user;
  }
};

const renderUnauthorized = (message, resObject, user = null, statusCode) => {
  if (statusCode) resObject.status(statusCode);
  return resObject.render('unauthorized', { message, user });
};

const urlsForUser = function(urlDatabase, userDatabase, userID) {
  if (arguments.length > 3) throw new Error('Error: too many arguments');
  if (arguments.length < 3) throw new Error('Error: not enough arguments');
  if (typeof urlDatabase !== 'object' || typeof userDatabase !== 'object' || typeof userID !== 'string') throw new Error('Error: invalid argument type');
  if (!userDatabase[userID]) throw new Error(`Error: User '${userID}' does not exist`);

  const urls = {};
  Object.keys(urlDatabase).forEach((key) => {
    if (urlDatabase[key].userID === userID) {
      urls[key] = urlDatabase[key];
    }
  });
  return urls;
};

module.exports = { generateRandomString, getUserByEmail, renderUnauthorized, urlsForUser };