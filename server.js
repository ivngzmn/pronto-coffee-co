const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const ObjectId = require("mongodb").ObjectId;
const { loadedEnvPath } = require("./config/load-env");
const configDB = require("./config/database.js");
const PORT = 3000;

require("./config/passport")(passport); // pass passport for configuration

const normalizeBaseUrl = (value) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const appBaseUrl =
  normalizeBaseUrl(process.env.APP_BASE_URL) ||
  `http://localhost:${process.env.PORT || PORT}`;
const marketingBaseUrl =
  normalizeBaseUrl(process.env.MARKETING_SITE_URL) || "http://localhost:4321";

app.locals.appBaseUrl = appBaseUrl;
app.locals.marketingBaseUrl = marketingBaseUrl;

// set up express application
app.use(morgan("dev")); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(express.json()); // get information from html forms
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

// required for passport
app.use(
  session({
    secret: "keyboard cat bongo",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Cookie Life - 24 hours
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

mongoose
  .connect(configDB.url)
  .then((connection) => {
    if (loadedEnvPath) {
      console.log(`Loaded environment from ${loadedEnvPath}`);
    }
    console.log(`Connected to ${configDB.dbName} DB 🗃'`);
    const db = connection.connection.db;
    require("./app/routes.js")(app, passport, db, ObjectId);
  })
  .catch((err) => {
    console.error(err);
  });

// launch 🚀
app.listen(process.env.PORT || PORT, function () {
  console.log(
    `🚨 The server is listening on port ${PORT} you better go catch it!!! 🚨`
  );
});
