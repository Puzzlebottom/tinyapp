const numerics = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ALPHANUMERIC_CHARS = [...numerics, ...upperCase, ...lowerCase];

module.exports = ALPHANUMERIC_CHARS;