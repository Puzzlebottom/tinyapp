const numerics = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ALPHANUMERIC_CHARS = [...numerics, ...upperCase, ...lowerCase];
const EMAIL_VALIDATION_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const SESSION_COOKIE_KEYS = ['abecedarian', 'brodingnagian', 'cassandraic', 'defenestration', 'equanimious', 'flimflammery'];
const PORT = 8080; // default port 8080

module.exports = { ALPHANUMERIC_CHARS, EMAIL_VALIDATION_REGEX, SESSION_COOKIE_KEYS, PORT };