const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
const configDB = require('./config/database.js');

require('dotenv').config({ path: './config/.env' });

mongoose.connect(configDB.url, (err, database) => {
  if (err) return console.log(err);
  console.log('Connected to database');
  let db = database;
  // routes
  require('./app/routes.js')(app, passport, db, ObjectId);
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration
// set up express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

// required for passport
app.use(
  session({
    secret: 'keyboard cat bongo',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Cookie Life - 24 hours
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// launch 🚀
app.listen(process.env.PORT || 3000, function () {
  console.log('The server is listening on port %d in %s mode');
});
