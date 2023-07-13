/* eslint-disable space-before-function-paren */
/* eslint-disable camelcase */
const { ERROR_MSG, SESSION_COOKIE_KEYS, PORT } = require('./constants');

const argon2 = require('argon2');
const cookieSession = require('cookie-session');
const express = require('express');
const { generateRandomString, getUserByEmail, logVisit, renderUnauthorized, urlsForUser } = require('./helpers');
const methodOverride = require('method-override');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');


const app = express();
const urlDatabase = {};
const users = {};

/**
 * SERVER SETUP
 */

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
  const { user_id } = req.session; //check cookie
  if (user_id) {
    return res.redirect('/urls'); // if user has valid cookie, let them in
  }
  return res.redirect('/register'); // otherwise bounce them.
});

/**
 * LOGIN / LOGOUT
 */

app.get('/login', (req, res) => {
  const { user_id } = req.session; // check cookie
  if (user_id) {
    return res.redirect('/urls'); // pass with a valid cookie
  }
  const templateVars = { user: users[user_id] };
  return res.render('login', templateVars); // or send to to login
});

app.post('/login', async (req, res) => { // async for hash checking
  const { email, password } = req.body;
  const user = getUserByEmail(users, email);
  if (user) {
    await argon2.verify(user['password'], password) // https://github.com/Puzzlebottom/tinyapp/tree/feature/bcrypt for bcrypt version
      .then((isValidPassword) => {
        if (user && isValidPassword) { // if we've got an account and your password is valid
          req.session.user_id = user.id; // you get a cookie
          return res.redirect('/urls'); // have fun
        }
        return renderUnauthorized(ERROR_MSG.badPassword(), res, null, 401); // your password doesn't check out
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, null, 500); // argon2 is broken
      });
  } else {
    return renderUnauthorized(ERROR_MSG.noAccount(email), res, null, 401); // we don't know who you are
  }
});

app.post('/logout', (req, res) => {
  req.session = null; // I want my cookie back
  return res.redirect('/login');
});

/**
 * REGISTRATION
 */

app.get('/register', (req, res) => {
  const { user_id } = req.session;  // gimme a cookie
  if (user_id) {                    // if it's good
    return res.redirect('/urls');   // I'll let you in
  }

  const templateVars = { user: users[user_id] };
  return res.render('register', templateVars); // or else you have to sign up
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
    await argon2.verify(user['password'], password) // and check that your password is valid
      .then(async (isValidPassword) => {
        if (user && !isValidPassword) {
          return renderUnauthorized(ERROR_MSG.accountExists(email), res, user, 403); // Senator, you're no Jack Kennedy.
        }

        if (user && isValidPassword) { // everything checks out
          req.session.user_id = user.id; // have another cookie
          return res.redirect('/urls'); // and go play
        }
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, user, 500); // argon2 is broken
      });
  } else {
    await argon2.hash(password) // hash it real good!
      .then((hash) => {
        const id = uuidv4(); // uuid for userID
        users[id] = { id, email, password: hash };
        req.session.user_id = id; // you get a cookie
        return res.redirect('/urls'); // welcome.
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, null, 500); // argon2 dropped the ball
      });
  }
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const userID = req.session['user_id']; // cookie?
  if (!userID) {
    return res.redirect('/login'); // no cookie.
  }
  const templateVars = { user: users[userID] };
  return res.render('urls_new', templateVars); // cookie!
});

app.post('/urls', (req, res) => {
  const userID = req.session['user_id']; // what has it gots in its pocketses, precious? A cookie?
  if (!userID) { // since there shouldn't be a way to hit this endpoint in the browser, you must be cURLing it.
    return res.send('UNAUTHORIZED: You must have a registered account and be logged in in order to use TinyURL.\n\n'); // we'll log the response where you can see it.
  }

  const { longURL } = req.body;
  const id = generateRandomString(urlDatabase, 6);
  const visits = { total: 0, unique: 0, visitors: [], logs: [] };
  urlDatabase[id] = { longURL, userID, visits }; // we built a urlObject!
  const user = users[userID];
  const templateVars = { user, id, longURL, visits };
  return res.render('urls_show', templateVars); // let's take a closer look at what we made.
});

/**
 * DELETE URL
 */

app.delete('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn, res); // can't delete if you're notLoggedIn
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user); // can't touch other peoples things
  }

  delete urlDatabase[id]; // buh-bye urlObject!
  return res.redirect('/urls'); // back to work
});

/**
 * UPDATE URL
 */

app.put('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res); // same deal as above
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user); // put the bunny back in the box
  }

  const { longURL } = req.body; // new data
  urlDatabase[id].longURL = longURL; // old => new
  return res.redirect('/urls'); // go and see what it is that you have wrought
});

/**
 * SINGLE URL
 */

app.get('/urls/:id', (req, res) => {
  const userID = req.session['user_id']; // cookie police
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res); // next time, bring more cookies.
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user); // no peeking
  }
  const { longURL, visits } = urlDatabase[id]; // pull the records out of storage
  const templateVars = { user, id, longURL, visits }; // jam them in the view
  return res.render('urls_show', templateVars); // enjoy the sweet sweet analytics
});

/**
 * ALL URLS
 */

app.get('/urls', (req, res) => {
  const userID = req.session['user_id']; // coo-key?
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res); // you don't belong here
  }
  const templateVars = { user: users[userID], urls: urlsForUser(urlDatabase, users, userID) }; // grab all of your stuff
  return res.render('urls_index', templateVars); // and go
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  let { visitor_id } = req.session;

  if (!visitor_id) {
    visitor_id = uuidv4();
    req.session.visitor_id = visitor_id;
  }

  const { id } = req.params;
  const { longURL } = urlDatabase[id];
  if (!longURL) {
    return res.send(`LINK NOT FOUND: An address corresponding to TinyURL ${id} doesn't exist in our records.\n\n`); // you mean naming a variable database doesn't actually make it a database!?
  }
  logVisit(urlDatabase, id, visitor_id); // log those sweet analytics

  return res.redirect(longURL); // so long, and thanks for all the fish
});

/**
 * RUN SERVER
 */

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`); // make computer go
});

