const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../app/models/user");

const PROVIDER_CONFIG = {
  google: {
    Strategy: GoogleStrategy,
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
    callbackEnv: "OAUTH_GOOGLE_CALLBACK_URL",
    profileFields: undefined,
  },
  github: {
    Strategy: GitHubStrategy,
    idEnv: "GITHUB_CLIENT_ID",
    secretEnv: "GITHUB_CLIENT_SECRET",
    callbackEnv: "OAUTH_GITHUB_CALLBACK_URL",
    profileFields: undefined,
  },
  facebook: {
    Strategy: FacebookStrategy,
    idEnv: "FACEBOOK_CLIENT_ID",
    secretEnv: "FACEBOOK_CLIENT_SECRET",
    callbackEnv: "OAUTH_FACEBOOK_CALLBACK_URL",
    profileFields: ["id", "displayName", "emails"],
  },
};

function configuredProviderNames() {
  return Object.entries(PROVIDER_CONFIG)
    .filter(([, config]) =>
      Boolean(
        process.env[config.idEnv] &&
          process.env[config.secretEnv] &&
          process.env[config.callbackEnv]
      )
    )
    .map(([provider]) => provider);
}

function primaryEmail(profile) {
  return profile.emails?.find((entry) => entry.value)?.value || "";
}

function displayNameFor(provider, profile) {
  return (
    profile.displayName ||
    profile.username ||
    primaryEmail(profile).split("@")[0] ||
    `Pronto ${provider} barista`
  );
}

function userRole(user) {
  return user?.role || "staff";
}

async function findOrCreateSocialUser(provider, accessToken, profile) {
  const email = primaryEmail(profile);
  const providerPath = `${provider}.id`;
  const queryOptions = [{ [providerPath]: profile.id }];

  if (email) {
    queryOptions.push(
      { [`${provider}.email`]: email },
      { "local.email": email },
      { "google.email": email },
      { "github.email": email },
      { "facebook.email": email }
    );
  }

  const query = { $or: queryOptions };

  let user = await User.findOne(query);

  if (!user) {
    user = new User();
    user.role = "staff";
  }

  user[provider] = {
    ...user[provider],
    id: profile.id,
    token: accessToken,
    email,
    name: displayNameFor(provider, profile),
    username: profile.username,
  };

  await user.save();
  return user;
}

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
          newUser.role = "staff";
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

          if (userRole(user) !== "staff") {
            return done(null, false, { message: "Use the customer login to order ahead." });
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

  configuredProviderNames().forEach((provider) => {
    const config = PROVIDER_CONFIG[provider];
    const strategyOptions = {
      clientID: process.env[config.idEnv],
      clientSecret: process.env[config.secretEnv],
      callbackURL: process.env[config.callbackEnv],
      passReqToCallback: false,
      state: true,
    };

    if (config.profileFields) {
      strategyOptions.profileFields = config.profileFields;
    }

    passport.use(
      provider,
      new config.Strategy(strategyOptions, async (accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateSocialUser(provider, accessToken, profile);
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      })
    );
  });
};

module.exports.configuredProviderNames = configuredProviderNames;
