const bcrypt = require('bcrypt');

const { User } = require('../scripts/entities/user');

const { ALPHANUMERIC_CHARS, EMAIL_VALIDATION_REGEX, ERROR_MSG } = require('./constants');
const { SALT_ROUNDS } = require('./constants');

/**
 * checkAuthorization() verifies the provided password: string against the
 * has stored in user: object.  If the validation is successful the User method
 * giveCookie() is called with the cookie object (req.session is passed as an argument
 * here for this purpose.)
 *
 * Redirects are returned in the case of an invalid password, or if the hashing
 * function fails.
 */

const checkAuthorization = async function(user, password, cookie, response) {
  await bcrypt.compare(password, user.password) // https://github.com/Puzzlebottom/tinyapp/tree/feature/bcrypt for bcrypt version
    .then((isValidPassword) => {
      if (isValidPassword) { // if we've got an account and your password is valid
        user.giveCookie(cookie); // you get a cookie
        return response.redirect('/urls'); // have fun
      }
      return renderUnauthorized(ERROR_MSG.badPassword(), response, null, 401); // your password doesn't check out
    })
    .catch(() => {
      return renderUnauthorized(ERROR_MSG.validationFail(), response, null, 500); // bcrypt is broken
    });
};

/**
 * checkPermissions() takes a user: object and a url: object and
 * compares the values to validate permission. A redirect is triggered on
 * the response: object if the validation returns false.
 */

const checkPermissions = (user, url, response) => {
  if (url.userID !== user.id) {
    return renderUnauthorized(ERROR_MSG.notOwned(url.id), response, user); // put the bunny back in the box
  }
};

/**
 * enterWithValidCookie() is a simple redirect to the /urls endpoint
 * if the user possesses a valid cookie. While modularizing this function
 * does do dry the code out, it improves readability quite a bit.
 */

const enterWithValidCookie = (cookie, response) => {
  if (cookie.user_id) return response.redirect('/urls'); // pass with a valid cookie
};

/**
 * exitWithNoValidCookie() provides a similar but opposite short-circuit
 * as above, triggering a redirect on the response object if the user is
 * missing a valid cookie.
 */

const exitWithNoValidCookie = (cookie, response) => {
  if (!cookie.user_id) return renderUnauthorized(ERROR_MSG.notLoggedIn(), response);
};

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
 * registerUser() provides a straighforward function but has alot
 * of moving pieces. Making it live with the helpers improves the
 * readability of the code.
 *
 * It either triggers redirects on the response object either to
 * the /urls endpoint (if registration is successful) or displays
 * an error if the hashing function fails.
 */

const registerUser = async function(userDatabase, email, password, cookie, response) {
  await bcrypt.hash(password, SALT_ROUNDS) // hash it real good!
    .then((hashedPassword) => {
      const user = new User(email, hashedPassword);
      userDatabase[user.id] = user;
      user.giveCookie(cookie); // you get a cookie
      return response.redirect('/urls'); // welcome
    })
    .catch(() => {
      return renderUnauthorized(ERROR_MSG.validationFail(), response, null, 500); // bcrypt dropped the ball
    });
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

module.exports = { checkAuthorization, checkPermissions, enterWithValidCookie, exitWithNoValidCookie, generateRandomString, getUserByEmail, registerUser, renderUnauthorized, urlsForUser };