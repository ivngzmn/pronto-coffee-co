const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { loadedEnvPath } = require("./config/load-env");
const configDB = require("./config/database");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

require("./config/passport")(passport);

const allowedOrigins = [
  process.env.FRONTEND_APP_URL,
  process.env.MARKETING_SITE_URL,
  process.env.APP_BASE_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
].filter(Boolean);

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me-in-env",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(configDB.url)
  .then((connection) => {
    if (loadedEnvPath) {
      console.log(`Loaded environment from ${loadedEnvPath}`);
    }

    console.log(`Connected to ${configDB.dbName} DB`);
    const db = connection.connection.db;
    require("./app/routes")(app, passport, db, ObjectId);

    app.listen(PORT, () => {
      console.log(`Pronto API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
