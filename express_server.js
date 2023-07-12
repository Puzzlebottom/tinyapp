/* eslint-disable space-before-function-paren */
/* eslint-disable camelcase */
const { ALPHANUMERIC_CHARS, ERROR_MSG, SESSION_COOKIE_KEYS, PORT } = require('./constants');

const argon2 = require('argon2');
const cookieSession = require('cookie-session');
const express = require('express');
const { generateRandomString, getUserByEmail, renderUnauthorized, urlsForUser } = require('./helpers');
const methodOverride = require('method-override');

const app = express();
const urlDatabase = {};
const users = {};

/**
 * SERVER SETUP
 */

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: SESSION_COOKIE_KEYS,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

/**
 * INDEX
 */

app.get('/', (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    return res.redirect('/urls');
  }
  return res.redirect('/register');
});

/**
 * LOGIN / LOGOUT
 */

app.get('/login', (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[user_id] };
  return res.render('login', templateVars);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(users, email);
  if (user) {
    await argon2.verify(user['password'], password)
      .then((isValidPassword) => {
        if (user && isValidPassword) {
          req.session.user_id = user.id;
          return res.redirect('/urls');
        }
        return renderUnauthorized(ERROR_MSG.badPassword(), res, null, 401);
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, null, 500);
      });
  } else {
    return renderUnauthorized(ERROR_MSG.noAccount(email), res, null, 401);
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/login');
});

/**
 * REGISTRATION
 */

app.get('/register', (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[user_id] };
  return res.render('register', templateVars);
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return renderUnauthorized(ERROR_MSG.blankForm(), res, null, 400);
  }

  const user = getUserByEmail(users, email);

  if (user) {
    await argon2.verify(user['password'], password)
      .then(async (isValidPassword) => {
        if (user && !isValidPassword) {
          return renderUnauthorized(ERROR_MSG.accountExists(email), res, user, 403);
        }

        if (user && isValidPassword) {
          req.session.user_id = user.id;
          return res.redirect('/urls');
        }
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, user, 500);
      });
  } else {
    await argon2.hash(password)
      .then((hash) => {
        const id = generateRandomString(users, 6);
        users[id] = { id, email, password: hash };
        req.session.user_id = id;
        return res.redirect('/urls');
      })
      .catch(() => {
        return renderUnauthorized(ERROR_MSG.validationFail(), res, null, 500);
      });
  }
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[userID] };
  return res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return res.send('UNAUTHORIZED: You must have a registered account and be logged in in order to use TinyURL.\n\n');
  }

  const { longURL } = req.body;
  const id = generateRandomString(urlDatabase, 6);
  urlDatabase[id] = { longURL, userID };
  const user = users[userID];
  const templateVars = { user, id, longURL };
  return res.render('urls_show', templateVars);
});

/**
 * DELETE URL
 */

app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn, res);
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user);
  }

  delete urlDatabase[id];
  return res.redirect('/urls');
});

/**
 * UPDATE URL
 */

app.post('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res);
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user);
  }

  const { longURL } = req.body;
  urlDatabase[id].longURL = longURL;
  return res.redirect('/urls');
});

/**
 * SINGLE URL
 */

app.get('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res);
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    return renderUnauthorized(ERROR_MSG.notOwned(id), res, user);
  }
  const { longURL } = urlDatabase[id];
  const templateVars = { user, id, longURL };
  return res.render('urls_show', templateVars);
});

/**
 * ALL URLS
 */

app.get('/urls', (req, res) => {
  const userID = req.session['user_id'];
  if (!userID) {
    return renderUnauthorized(ERROR_MSG.notLoggedIn(), res);
  }
  const templateVars = { user: users[userID], urls: urlsForUser(urlDatabase, users, userID) };
  return res.render('urls_index', templateVars);
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  const { longURL } = urlDatabase[id];
  if (!longURL) {
    return res.send(`LINK NOT FOUND: An address corresponding to TinyURL ${id} doesn't exist in our records.\n\n`);
  }
  return res.redirect(longURL);
});

/**
 * RUN SERVER
 */

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

