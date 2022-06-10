const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
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
        console.log(req);
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email': email }, function (err, user) {
          // if there are any errors, return the error
          if (err) return done(err);
          // check to see if theres already a user with that email
          if (user) {
            return done(
              null,
              false,
              req.flash('signupMessage', 'That email is already taken.')
            );
          } else {
            // grab the user's info from the form
            const userName = req.body.userName;
            // create the user
            const newUser = new User({ userName, email, password });
            // set the user's local credentials
            newUser.local.userName = userName; // pulled out my hair for this one
            newUser.local.email = email;
            newUser.local.password = newUser.generateHash(password);
            // save the user
            newUser.save(function (err) {
              if (err) throw err;
              return done(null, newUser);
            });
          }
        });
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
      function (req, email, password, done) {
        User.findOne({ 'local.email': email }, function (err, user) {
          if (err) return done(err);
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
        });
      }
    )
  );
};
