const User = require("./models/user");

function normalizeBaseUrl(value) {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function userRole(user) {
  return user?.role || "staff";
}

function formatPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 10);

  if (digits.length !== 10) return "";

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user._id,
    role: userRole(user),
    userName: user.local?.userName || user.google?.name || user.github?.name || user.facebook?.name,
    email: user.local?.email || user.google?.email || user.github?.email || user.facebook?.email,
    phone: user.local?.phone || "",
  };
}

function serializeOrder(order) {
  return {
    id: order._id,
    name: order.name,
    order: order.order,
    completed: order.completed,
    orderTaker: order.orderTaker,
    barista: order.barista,
    source: order.source || "staff",
    fulfillmentType: order.fulfillmentType || "counter",
    customerPhone: order.customerPhone || "",
  };
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Authentication required." });
}

function ensureRole(roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(userRole(req.user))) {
      return res.status(403).json({ error: "You do not have access to that resource." });
    }

    return next();
  };
}

function redirectTo(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

module.exports = function registerRoutes(app, passport, db, ObjectId) {
  const appBaseUrl = normalizeBaseUrl(process.env.APP_BASE_URL) || "http://localhost:3000";
  const frontendBaseUrl =
    normalizeBaseUrl(process.env.FRONTEND_APP_URL) || "http://localhost:5173";
  const marketingBaseUrl =
    normalizeBaseUrl(process.env.MARKETING_SITE_URL) || "http://localhost:4321";
  const configuredProviderNames = require("../config/passport").configuredProviderNames;
  const enabledProviders = configuredProviderNames();
  const providerScopes = {
    google: ["profile", "email"],
    github: ["user:email"],
    facebook: ["email"],
  };

  app.get("/", (req, res) => res.redirect(redirectTo(marketingBaseUrl, "/")));
  app.get("/contact", (req, res) =>
    res.redirect(redirectTo(marketingBaseUrl, "/contact/"))
  );
  app.get("/blog", (req, res) => res.redirect(redirectTo(marketingBaseUrl, "/blog/")));
  app.get("/how-to-brew-the-perfect-cup", (req, res) =>
    res.redirect(redirectTo(marketingBaseUrl, "/blog/how-to-brew-the-perfect-cup/"))
  );

  app.get("/login", (req, res) => res.redirect(redirectTo(frontendBaseUrl, "/login")));
  app.get("/signup", (req, res) => res.redirect(redirectTo(frontendBaseUrl, "/signup")));
  app.get("/profile", (req, res) => res.redirect(redirectTo(frontendBaseUrl, "/profile")));
  app.get("/order-dashboard", (req, res) =>
    res.redirect(redirectTo(frontendBaseUrl, "/order-dashboard"))
  );
  app.get("/barista-order-dashboard", (req, res) =>
    res.redirect(redirectTo(frontendBaseUrl, "/barista-order-dashboard"))
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      appBaseUrl,
      frontendBaseUrl,
      marketingBaseUrl,
    });
  });

  app.get("/api/session", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: serializeUser(req.user),
    });
  });

  app.post("/api/customer/auth/signup", async (req, res, next) => {
    try {
      const userName = typeof req.body.userName === "string" ? req.body.userName.trim() : "";
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const phone = formatPhoneNumber(req.body.phone);
      const password = typeof req.body.password === "string" ? req.body.password : "";

      if (!userName || !email || !phone || !password) {
        return res.status(400).json({ error: "Name, email, phone, and password are required." });
      }

      const existingUser = await User.findOne({ "local.email": email });
      if (existingUser) {
        return res.status(400).json({ error: "That email is already taken." });
      }

      const user = new User();
      user.role = "customer";
      user.local.userName = userName;
      user.local.email = email;
      user.local.phone = phone;
      user.local.password = user.generateHash(password);
      await user.save();

      req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return res.status(201).json({ user: serializeUser(user) });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/customer/auth/login", async (req, res, next) => {
    try {
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body.password === "string" ? req.body.password : "";
      const user = await User.findOne({ "local.email": email });

      if (!user || userRole(user) !== "customer" || !user.validPassword(password)) {
        return res.status(401).json({ error: "Unable to log in with those customer credentials." });
      }

      req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return res.json({ user: serializeUser(user) });
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/auth/providers", (_req, res) => {
    res.json({
      providers: ["google", "github", "facebook"].map((provider) => ({
        id: provider,
        enabled: enabledProviders.includes(provider),
        loginUrl: `/api/auth/${provider}`,
      })),
    });
  });

  app.get("/api/auth/:provider", (req, res, next) => {
    const provider = req.params.provider;

    if (!enabledProviders.includes(provider)) {
      return res.status(404).json({ error: "That social sign-in provider is not configured." });
    }

    return passport.authenticate(provider, {
      scope: providerScopes[provider],
    })(req, res, next);
  });

  app.get("/api/auth/:provider/callback", (req, res, next) => {
    const provider = req.params.provider;

    if (!enabledProviders.includes(provider)) {
      return res.redirect(redirectTo(frontendBaseUrl, "/login?error=social-provider"));
    }

    return passport.authenticate(provider, {
      failureRedirect: redirectTo(frontendBaseUrl, "/login?error=social-auth"),
      successRedirect: redirectTo(frontendBaseUrl, "/profile"),
    })(req, res, next);
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local-login", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Unable to log in." });
      }

      req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return res.json({ user: serializeUser(user) });
      });
    })(req, res, next);
  });

  app.post("/api/auth/signup", (req, res, next) => {
    passport.authenticate("local-signup", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(400).json({ error: info?.message || "Unable to sign up." });
      }

      req.logIn(user, (loginError) => {
        if (loginError) return next(loginError);
        return res.status(201).json({ user: serializeUser(user) });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.status(204).end();
      });
    });
  });

  app.get("/api/profile", ensureRole(["staff"]), async (req, res, next) => {
    try {
      const result = await db.collection("order").find().toArray();
      const pending = result.filter((order) => order.completed === false);
      const completed = result.filter((order) => order.completed === true);

      res.json({
        user: serializeUser(req.user),
        orders: pending.map(serializeOrder),
        completed: completed.map(serializeOrder),
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/orders", ensureRole(["staff"]), async (_req, res, next) => {
    try {
      const result = await db.collection("order").find().toArray();
      res.json({
        orders: result.filter((order) => !order.completed).map(serializeOrder),
        completed: result.filter((order) => order.completed).map(serializeOrder),
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/orders", ensureRole(["staff"]), async (req, res, next) => {
    try {
      const payload = {
        name: req.body.name,
        order: req.body.order,
        completed: false,
        orderTaker: req.body.orderTaker,
        barista: "",
        source: req.body.source || "staff",
        fulfillmentType: req.body.fulfillmentType || "counter",
        customerPhone: req.body.customerPhone || "",
      };

      const result = await db.collection("order").insertOne(payload);
      res.status(201).json({
        order: serializeOrder({ _id: result.insertedId, ...payload }),
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/order-ahead", ensureRole(["customer", "staff"]), async (req, res, next) => {
    try {
      const currentUser = serializeUser(req.user);
      const requestName = typeof req.body.name === "string" ? req.body.name.trim() : "";
      const name = currentUser?.userName || requestName || currentUser?.email || "";
      const customerPhone =
        currentUser?.phone || formatPhoneNumber(req.body.customerPhone);
      const order = Array.isArray(req.body.order)
        ? req.body.order.filter((item) => typeof item === "string" && item.trim())
        : [];

      if (!name || !customerPhone || order.length === 0) {
        return res
          .status(400)
          .json({ error: "Add a customer name, phone number, and at least one menu item." });
      }

      const payload = {
        name,
        order,
        completed: false,
        orderTaker: "Order Ahead",
        barista: "",
        source: "online",
        fulfillmentType: "pickup",
        customerPhone,
        customerEmail: currentUser?.email || "",
      };

      const result = await db.collection("order").insertOne(payload);
      return res.status(201).json({
        order: serializeOrder({ _id: result.insertedId, ...payload }),
      });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/orders/:id/complete", ensureRole(["staff"]), async (req, res, next) => {
    try {
      const result = await db.collection("order").findOneAndUpdate(
        { _id: ObjectId.createFromHexString(req.params.id) },
        {
          $set: {
            completed: true,
            barista: req.body.barista,
          },
        },
        { returnDocument: "after" }
      );

      res.json({ order: serializeOrder(result?.value || result) });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/orders/:id", ensureRole(["staff"]), async (req, res, next) => {
    try {
      await db.collection("order").findOneAndDelete({
        _id: ObjectId.createFromHexString(req.params.id),
      });

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found." });
    }

    return res.status(404).redirect(redirectTo(marketingBaseUrl, "/404.html"));
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  });
};
