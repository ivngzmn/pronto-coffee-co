const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const configDB = require('./config/database.js');
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config({ path: './config/.env' });

let db;

mongoose.connect(configDB.url, (err, database) => {
  if (err) return console.log(err);
  db = database;
  require('./app/routes.js')(app, passport, db, ObjectId);
});

require('./config/passport')(passport);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'keyboard cat bongo',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Cookie Life - 24 hours
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.listen(process.env.PORT || 3000, function () {
  console.log(
    'The server is listening on port %d in %s mode',
    this.address().port,
    app.settings.env
  );
});
