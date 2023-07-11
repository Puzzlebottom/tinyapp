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

/**
 * INDEX
 */

app.get('/', (req, res) => {
  const { username } = req.cookies;
  if (username) {
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
  res.clearCookie('username');
  return res.redirect('/');
});

app.get('/register', (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  return res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  //do something
  return res.redirect('/urls');
});

/**
 * ADD URL
 */

app.get('/urls/new', (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const { longURL } = req.body;
  const id = generateRandomString(6);
  urlDatabase[id] = longURL;
  const templateVars = { username: req.cookies['username'], id, longURL };
  res.render('urls_show', templateVars);
});

/**
 * DELETE URL
 */

app.post('/urls/:id/delete', (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect('/urls');
});

/**
 * UPDATE URL
 */

app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  const { longURL } = req.body;
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});

/**
 * SINGLE URL
 */

app.get('/urls/:id', (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  const templateVars = { username: req.cookies['username'], id, longURL };
  res.render('urls_show', templateVars);
});

/**
 * ALL URLS
 */

app.get('/urls', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

/**
 * NAVIGATE TO LINK
 */

app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
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