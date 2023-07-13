/* eslint-disable space-before-function-paren */
/* eslint-disable camelcase */
const { ERROR_MSG, SESSION_COOKIE_KEYS, PORT } = require('./public/scripts/constants');

const cookieSession = require('cookie-session');
const express = require('express');
const { checkAuthorization, checkPermissions, enterWithValidCookie, exitWithNoValidCookie, generateRandomString, getUserByEmail, registerUser, renderUnauthorized, urlsForUser } = require('./public/scripts/helpers');
const methodOverride = require('method-override');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const { TinyURL } = require('./public/scripts/entities/tiny_url');

const urlDatabase = {};
const users = {};

/**
 * SERVER SETUP
*/

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use(cookieSession({
  name: 'session',
  keys: SESSION_COOKIE_KEYS,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

/**
 * INDEX
 */

app.get('/', (req, res) => {
  const cookie = req.session; //check cookie
  enterWithValidCookie(cookie, res);
  return res.redirect('/register'); // otherwise bounce them.
});

/**
 * LOGIN / LOGOUT
 */

app.get('/login', (req, res) => {
  const cookie = req.session; // check cookie
  enterWithValidCookie(cookie, res);
  const user = users[cookie.user_id];
  return res.render('login', { user }); // or send to to login
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(users, email);
  if (user) {
    return checkAuthorization(user, password, req.session, res);
  }
  return renderUnauthorized(ERROR_MSG.noAccount(email), res, null, 401); // we don't know who you are
});

app.post('/logout', (req, res) => {
  req.session.user_id = null; // I want my user_id cookie back. You can keep your visitor_id cookie if you've got one.
  return res.redirect('/login');
});

/**
 * REGISTRATION
 */

app.get('/register', (req, res) => {
  const cookie = req.session;  // gimme a cookie
  enterWithValidCookie(cookie, res);
  const user = users[cookie.user_id];
  return res.render('register', { user }); // or else you have to sign up
});

/**
 * Below, I've implemented a check similar to what we've got in POST /login,
 * if you try to register with an email and password that both match a stored
 * account, we might as well let you in.
 */

app.post('/register', async (req, res) => { // async for hash checking
  const { email, password } = req.body; // I want your deets

  if (!email || !password) {
    return renderUnauthorized(ERROR_MSG.blankForm(), res, null, 400); // this form is missing something...
  }

  const user = getUserByEmail(users, email); // let me pull up your account

  if (user) {
    return checkAuthorization(user, password, req.session, res);

  } else {
    return registerUser(users, email, password, req.session, res);
  }
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const cookie = req.session;
  exitWithNoValidCookie(cookie, res);// cookie?
  const user = users[cookie.user_id];
  return res.render('urls_new', { user }); // cookie!
});

app.post('/urls', (req, res) => {
  const userID = req.session['user_id']; // what has it gots in its pocketses, precious? A cookie?
  if (!userID) { // since there shouldn't be a way to hit this endpoint in the browser, you must be cURLing it.
    return res.send('UNAUTHORIZED: You must have a registered account and be logged in in order to use TinyURL.\n\n'); // we'll log the response where you can see it.
  }

  const { longURL } = req.body;
  const id = generateRandomString(urlDatabase, 6);
  const url = new TinyURL(id, longURL, userID); // we built a urlObject!

  urlDatabase[url.id] = url; //and stored it

  const user = users[userID];
  return res.render('urls_show', { user, url }); // let's take a closer look at what we made.
});

/**
 * DELETE URL
 */

app.delete('/urls/:id', (req, res) => {
  const cookie = req.session;
  exitWithNoValidCookie(cookie, res);

  const user = users[cookie.user_id];
  const url = urlDatabase[req.params.id];
  checkPermissions(user, url, res);

  delete urlDatabase[url.id]; // buh-bye urlObject!
  return res.redirect('/urls'); // back to work
});

/**
 * UPDATE URL
 */

app.put('/urls/:id', (req, res) => {
  const cookie = req.session;
  exitWithNoValidCookie(cookie, res);

  const user = users[cookie.user_id];
  const url = urlDatabase[req.params.id];
  checkPermissions(user, url, res);

  const newURL = req.body.longURL; // new data
  url.updateLongURL(newURL);

  return res.redirect('/urls'); // go and see what it is that you have wrought
});

/**
 * SINGLE URL
 */

app.get('/urls/:id', (req, res) => {
  const cookie = req.session;
  exitWithNoValidCookie(cookie, res);

  const user = users[cookie.user_id];
  const url = urlDatabase[req.params.id];
  checkPermissions(user, url, res);

  const templateVars = { user, url }; // jam them in the view
  return res.render('urls_show', templateVars); // enjoy the sweet sweet analytics
});

/**
 * ALL URLS
 */

app.get('/urls', (req, res) => {
  const cookie = req.session;
  exitWithNoValidCookie(cookie, res);

  const user = users[cookie.user_id];
  const urls = urlsForUser(urlDatabase, users, user.id);

  return res.render('urls_index', { user, urls }); // and go
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  const cookie = req.session;

  if (!cookie.visitor_id) {
    cookie.visitor_id = uuidv4(); // get a visitor_id cookie
  }

  const url = urlDatabase[req.params.id];
  if (!url) {
    return res.send(`LINK NOT FOUND: An address corresponding to TinyURL ${url.id} doesn't exist in our records.\n\n`); // you mean naming a variable database doesn't actually make it a database!?
  }
  url.logVisit(cookie.visitor_id); // log those sweet analytics

  return res.redirect(url.longURL); // so long, and thanks for all the fish
});

/**
 * RUN SERVER
 */

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`); // make computer go
});

