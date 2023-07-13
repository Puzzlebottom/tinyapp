const { ALPHANUMERIC_CHARS, EMAIL_VALIDATION_REGEX } = require('./constants');

/**
 * generateRandomString() is now used only to create tinyURLs.
 * uuidv4 is used to create userIDs and visitorIDs.
 *
 * It takes as arguments database: object (whose keys are used for
 * comparison to guarantee no duplicates) and a stringLength: number
 * which controls the length of generated string. Valid characters
 * are imported as an array in ALPHANUMERIC_CHARS.
 */

const generateRandomString = function(database, stringLength) {
  if (arguments.length > 2) throw new Error('Error: too many arguments');
  if (arguments.length < 2) throw new Error('Error: not enough arguments');
  if (typeof database !== 'object' || typeof stringLength !== 'number') throw new Error('Error: invalid argument type');


  const totalNumberOfChars = ALPHANUMERIC_CHARS.length;
  let randomString = '';
  for (let i = 1; i <= stringLength; i++) {
    const randomIndex = Math.floor(Math.random() * totalNumberOfChars);
    randomString += ALPHANUMERIC_CHARS[randomIndex];
  }
  const alreadyExists = Object.keys(database).includes(randomString);
  return alreadyExists ? generateRandomString(database, stringLength) : randomString;
};

/**
 * getUserByEmail() returns a user: object whose email property
 * matches the provided email: string.
 *
 * Validation of email format is supplemental to that provided by
 * the html input type="email".
 */

const getUserByEmail = function(users, email) {
  if (arguments.length > 2) throw new Error('Error: too many arguments');
  if (arguments.length < 2) throw new Error('Error: not enough arguments');
  if (typeof users !== 'object' || typeof email !== 'string') throw new Error('Error: invalid argument type');
  if (!EMAIL_VALIDATION_REGEX.test(email)) throw new Error('Error: not a valid email address');

  for (const user of Object.values(users)) {
    if (user.email === email) return user;
  }
};

/**
 * renderUnauthorized() is a generic landing page for errors and
 * warning messages. It provides a more seamless user experience than
 * default browser errors.
 *
 * It takes a message: string, the resObject: response object, and optionally
 * a user: object and statusCode: number. The options make the landing page
 * more versatile, since it is sometimes shown to logged in users and sometimes
 * to users with no credentials.
 */

const renderUnauthorized = (message, resObject, user = null, statusCode) => {
  if (statusCode) resObject.status(statusCode);
  return resObject.render('unauthorized', { message, user });
};

/**
 * urlsForUser() returns all urls owned by a user identified by their userID: string.
 * the urlDatabase and userDatabase: objects are included as arguments to isolate the
 * function and make testing more straightforward.
 */

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

/**
 * logVisit() is called whenever a someone (a user or otherwise) uses
 * a TinyURL link. It selects a url object from the urlDatabase: object by
 * matching its urlID: string.
 *
 * It increments the total visits and then checks whether the visitorID
 * matches any previous users of this TinyURL. New visitors have their visitorID
 * recorded along with a timestamp of the link's use.
 */

const logVisit = function(urlDatabase, urlID, visitorID) {
  if (arguments.length > 3) throw new Error('Error: too many arguments');
  if (arguments.length < 3) throw new Error('Error: not enough arguments');
  if (typeof urlDatabase !== 'object' || typeof urlID !== 'string' || typeof visitorID !== 'string') throw new Error('Error: invalid argument type');

  const url = urlDatabase[urlID]; // get URL
  const { visits } = url;
  visits.total = visits.total += 1; // increment total visits
  if (!visits.visitors.includes(visitorID)) { // check if visitor has used the link before
    visits.visitors.push(visitorID); // store visitorID
    visits.unique = visits.unique += 1; // increment unique visits
  }
  visits.logs.unshift({ visitorID, timeStamp: new Date().toGMTString() }); // add visit to log
};

module.exports = { generateRandomString, getUserByEmail, logVisit, renderUnauthorized, urlsForUser };