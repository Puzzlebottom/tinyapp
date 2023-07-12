const { ALPHANUMERIC_CHARS } = require('./constants');

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

const getUserByEmail = (users, email) => {
  for (const user of Object.values(users)) {
    if (user.email === email) return user;
  }
  return null;
};

const renderUnauthorized = (message, resObject, user = null, statusCode) => {
  if (statusCode) resObject.status(statusCode);
  return resObject.render('unauthorized', { message, user });
};

const urlsForUser = (urlDatabase, userID) => {
  const urls = {};
  Object.keys(urlDatabase).forEach((key) => {
    if (urlDatabase[key].userID === userID) {
      urls[key] = urlDatabase[key];
    }
  });
  return urls;
};

module.exports = { generateRandomString, getUserByEmail, renderUnauthorized, urlsForUser };