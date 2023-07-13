class TinyURL {
  constructor(id, longURL, userID) {
    this._id = id;
    this._longURL = longURL;
    this._userID = userID;
    this._totalVisits = 0;
    this._uniqueVisits = 0;
    this._visitors = [];
    this._logs = [];
  }

  get id() {
    return this._id;
  }
  get longURL() {
    return this._longURL;
  }
  get userID() {
    return this._userID;
  }
  get totalVisits() {
    return this._totalVisits;
  }
  get uniqueVisits() {
    return this._uniqueVisits;
  }
  get logs() {
    return this._logs;
  }

  updateLongURL(newURL) {
    this._longURL = newURL;
  }

  isOwnedBy(userID) {
    return this._userID === userID;
  }

  isNewVisitor(visitorID) {
    return !this._visitors.includes(visitorID);
  }

  logVisit(visitorID) {
    this._totalVisits = this._totalVisits += 1;
    if (this.isNewVisitor(visitorID)) {
      this._visitors.push(visitorID);
      this._uniqueVisits = this._uniqueVisits += 1;
    }
    const timeStamp = new Date().toGMTString();
    this._logs.unshift({ visitorID, timeStamp });
  }
}

module.exports = { TinyURL };