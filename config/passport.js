const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(async function (id, done) {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  // local signup
  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        try {
          const user = await User.findOne({ 'local.email': email });
          // check to see if theres already a user with that email
          if (user) {
            return done(
              null,
              false,
              req.flash('signupMessage', 'That email is already taken.')
            );
          }

          // grab the user's info from the form
          const userName = req.body.userName;
          // create the user
          const newUser = new User({ userName, email, password });
          // set the user's local credentials
          newUser.local.userName = userName; // pulled out my hair for this one
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);
          // save the user
          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  // local login
  passport.use(
    'local-login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async function (req, email, password, done) {
        try {
          const user = await User.findOne({ 'local.email': email });
          if (!user)
            return done(
              null,
              false,
              req.flash('loginMessage', 'No user found.')
            );
          if (!user.validPassword(password))
            return done(
              null,
              false,
              req.flash('loginMessage', 'Oops! Wrong password.')
            );
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};
