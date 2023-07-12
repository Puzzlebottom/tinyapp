const numerics = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ALPHANUMERIC_CHARS = [...numerics, ...upperCase, ...lowerCase];
const EMAIL_VALIDATION_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const SESSION_COOKIE_KEYS = ['abecedarian', 'brodingnagian', 'cassandraic', 'defenestration', 'equanimious', 'flimflammery'];
const PORT = 8080; // default port 8080
const ERROR_MSG = {
  badPassword: () => '401 Error: Invalid Password',
  validationFail: () => '500 Error: Something went wrong and we were unable to verify your password',
  noAccount: (email) => `401 Error: No account found for ${email}`,
  blankForm: () => '400 Error: The email and password fields cannot be blank',
  accountExists: (email) => `403 Error: An account for ${email} already exists`,
  notLoggedIn: () => 'Log in to your account to use TinyURL',
  notOwned: (id) => `The TinyURL ${id} is not registered to this account`,
};

module.exports = { ALPHANUMERIC_CHARS, ERROR_MSG, EMAIL_VALIDATION_REGEX, SESSION_COOKIE_KEYS, PORT };