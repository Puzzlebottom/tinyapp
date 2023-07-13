/* eslint-disable camelcase */
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(email, password) {
    this._id = uuidv4();
    this._email = email;
    this._password = password;
  }

  get id() {
    return this._id;
  }
  get email() {
    return this._email;
  }
  get password() {
    return this._password;
  }

  giveCookie(session) {
    return session.user_id = this.id;
  }

  deleteCookie(session) {
    return session.user_id = null;
  }
}

module.exports = { User };