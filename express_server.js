/* eslint-disable camelcase */
const express = require('express');
const cookieParser = require('cookie-parser');
const ALPHANUMERIC_CHARS = require('./constants');
const PORT = 8080; // default port 8080

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

/**
 * INDEX
 */

app.get('/', (req, res) => {
  const { user_id } = req.cookies;
  if (user_id) {
    return res.redirect('/urls');
  }
  return res.redirect('/register');
});

/**
 * LOGIN / LOGOUT
 */

app.get('/login', (req, res) => {
  const { user_id } = req.cookies;
  if (user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[user_id] };
  return res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUser(email);
  if (user && user.password === password) {
    res.cookie('user_id', user.id);
    return res.redirect('/urls');
  }
  return res.status(403).end();
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/login');
});

/**
 * REGISTRATION
 */

app.get('/register', (req, res) => {
  const { user_id } = req.cookies;
  if (user_id) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[user_id] };
  return res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const user = getUser(email);

  if (!email || !password) {
    res.statusMessage = 'email and password fields cannot be blank';
    return res.status(400).end();
  }

  if (user && user.password !== password) {
    res.statusMessage = 'a user with that email has already been registered';
    return res.status(400).end();
  }

  if (user && user.password === password) {
    res.cookie('user_id', user.id);
    return res.redirect('/urls');
  }

  const id = generateRandomString(6);
  users[id] = { id, email, password };
  res.cookie('user_id', id);

  return res.redirect('/urls');
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[userId] };
  return res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    return res.send('UNAUTHORIZED: You must have a registered account and be logged in in order to use TinyURL.\n\n');
  }

  const { longURL } = req.body;
  const id = generateRandomString(6);
  urlDatabase[id] = longURL;
  const user = users[userId];
  const templateVars = { user, id, longURL };
  return res.render('urls_show', templateVars);
});

/**
 * DELETE URL
 */

app.post('/urls/:id/delete', (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];
  return res.redirect('/urls');
});

/**
 * UPDATE URL
 */

app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  const { longURL } = req.body;
  urlDatabase[id] = longURL;
  return res.redirect('/urls');
});

/**
 * SINGLE URL
 */

app.get('/urls/:id', (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  const user = users[req.cookies['user_id']];
  const templateVars = { user, id, longURL };
  return res.render('urls_show', templateVars);
});

/**
 * ALL URLS
 */

app.get('/urls', (req, res) => {
  const id = req.cookies['user_id'];
  const templateVars = { user: users[id], urls: urlDatabase };
  return res.render('urls_index', templateVars);
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  if (!longURL) {
    return res.send(`LINK NOT FOUND: An address corresponding to TinyURL ${id} doesn't exist in our records.\n\n`);
  }
  return res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

const generateRandomString = (stringLength) => {
  const totalNumberOfChars = ALPHANUMERIC_CHARS.length;
  let randomString = '';
  for (let i = 1; i <= stringLength; i++) {
    const randomIndex = Math.floor(Math.random() * totalNumberOfChars);
    randomString += ALPHANUMERIC_CHARS[randomIndex];
  }
  const alreadyExists = Object.keys(urlDatabase).includes(randomString);
  return alreadyExists ? generateRandomString(stringLength) : randomString;
};

const getUser = (email) => {
  for (const user of Object.values(users)) {
    if (user.email === email) return user;
  }
  return null;
};

