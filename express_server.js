/* eslint-disable space-before-function-paren */
/* eslint-disable camelcase */
const argon2 = require('argon2');
const express = require('express');
const cookieSession = require('cookie-session');
const { SESSION_COOKIE_KEYS, PORT } = require('./constants');
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');

const app = express();
const urlDatabase = {};
const users = {};

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
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
        const message = '401 Error: Invalid Password';
        res.status(401);
        return res.render('unauthorized', { message, user: null });
      })
      .catch(() => {
        const message = '500 Error: Something went wrong and we were unable to verify your password';
        res.status(500);
        return res.render('unauthorized', { message, user: null });
      });
  } else {
    const message = `401 Error: No account found for ${email}`;
    res.status(401);
    return res.render('unauthorized', { message, user });
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
    const message = '400 Error: The email and password fields cannot be blank';
    res.status(400);
    return res.render('unauthorized', { message, user });
  }

  const user = getUserByEmail(users, email);

  if (user) {
    await argon2.verify(user['password'], password)
      .then(async (isValidPassword) => {
        if (user && !isValidPassword) {
          const message = `403 Error: An account for ${email} already exists`;
          res.status(403);
          return res.render('unauthorized', { message, user });
        }

        if (user && isValidPassword) {
          req.session.user_id = user.id;
          return res.redirect('/urls');
        }
      })
      .catch(() => {
        const message = '500 Error: Something went wrong and we were unable to create an account';
        res.status(500);
        return res.render('unauthorized', { message, user });
      });
  } else {
    await argon2.hash(password)
      .then((hash) => {
        const id = generateRandomString(urlDatabase, 6);
        users[id] = { id, email, password: hash };
        req.session.user_id = id;
        return res.redirect('/urls');
      })
      .catch(() => {
        const message = '500 Error: Something went wrong and we were unable to create an account';
        res.status(500);
        return res.render('unauthorized', { message, user });
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
    const message = 'Log in to your account to use TinyURL';
    return res.render('unauthorized', { message, user: null });
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    const message = `The TinyURL ${id} is not registered to this account`;
    return res.render('unauthorized', { message, user });
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
    const message = 'Log in to your account to use TinyURL';
    return res.render('unauthorized', { message, user: null });
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    const message = `The TinyURL ${id} is not registered to this account`;
    return res.render('unauthorized', { message, user });
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
    const message = 'Log in to your account to use TinyURL';
    return res.render('unauthorized', { message, user: null });
  }

  const user = users[userID];
  const { id } = req.params;
  if (urlDatabase[id].userID !== userID) {
    const message = `The TinyURL ${id} is not registered to this account`;
    return res.render('unauthorized', { message, user });
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
    const message = 'Log in to your account to use TinyURL';
    return res.render('unauthorized', { message, user: null });
  }
  const templateVars = { user: users[userID], urls: urlsForUser(urlDatabase, userID) };
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


app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

