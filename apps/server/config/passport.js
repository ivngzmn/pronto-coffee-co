const LocalStrategy = require("passport-local").Strategy;
const User = require("../app/models/user");

module.exports = function configurePassport(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const existingUser = await User.findOne({ "local.email": email });

          if (existingUser) {
            return done(null, false, {
              message: "That email is already taken.",
            });
          }

          const userName = req.body.userName;
          const newUser = new User();
          newUser.local.userName = userName;
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const user = await User.findOne({ "local.email": email });

          if (!user) {
            return done(null, false, { message: "No user found." });
          }

          if (!user.validPassword(password)) {
            return done(null, false, { message: "Oops! Wrong password." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};
