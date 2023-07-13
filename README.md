# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

Long live short URLs!

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Dependencies

- Node.js
- Express
- EJS
- argon2
- cookie-session
- method-override
- morgan
- uuid

## Features

### A streamlined interface 

Just plug a URL into our simple form and hit SUBMIT.

<img src="https://github.com/Puzzlebottom/tinyapp/blob/main/docs/streamlined-interface.png?raw=true" alt="a streamlined interface" width="500"/>

---

### A stylish index of your saved urls

A handy place that brings together an elegant index of your saved URLs with the tools to need to manage them.<br />

Tools including:
- Editing your link destinations (Rick-rolling never gets old, am I right?)
- One easy click copies your TinyURL to clipboard
- Delete old URLs and move on with your life!<br />

<img src="https://github.com/Puzzlebottom/tinyapp/blob/main/docs/urls-page.png?raw=true" alt="a stylish index of saved urls" width="500"/>

---

### Comprehensive analytic tools that track visitors use of your TinyURLs

 You're gonna want to know who's using your links!<br /> 

In addition to tracking both TOTAL and UNIQUE visits, our logging system displays a timestamp for each and every click you get!

<img src="https://github.com/Puzzlebottom/tinyapp/blob/main/docs/analytics.png?raw=true" alt="comprehensive analytics" width="500"/>

---

### Robust security features keep your data safe

We have implementations of both Argon2 and Bcrypt to serve all your hashing and verification needs.<br />

Encrypted session cookies help use keep track of both users and visitors without putting their credentials at risk.

---