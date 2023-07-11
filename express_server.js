const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const ALPHANUMERIC_CHARS = require('./constants');

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
 * LOGIN / REGISTRATION
 */

app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  return res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/');
});

app.get('/register', (req, res) => {
  const user = users[req.cookies['user_id']];
  const templateVars = { user };
  return res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString(6);
  users[id] = { id, email, password };
  res.cookie('user_id', id);

  return res.redirect('/urls');
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const user = users[req.cookies['user_id']];
  const templateVars = { user };
  return res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const { longURL } = req.body;
  const id = generateRandomString(6);
  urlDatabase[id] = longURL;
  const user = users[req.cookies['user_id']];
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
  const userID = req.cookies['user_id'];
  console.log(userID);

  const user = users[userID];
  console.log(user);
  const templateVars = { user, urls: urlDatabase };
  return res.render('urls_index', templateVars);
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  return res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
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