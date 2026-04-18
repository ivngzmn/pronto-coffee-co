module.exports = function (app, passport, db, ObjectId) {
  const marketingUrl = (path = "/") => `${app.locals.marketingBaseUrl}${path}`;

  // normal routes ===============================================================
  // home route
  app.get("/", function (req, res) {
    res.redirect(marketingUrl("/"));
  });
  // the contact route
  app.get("/contact", function (req, res) {
    res.redirect(marketingUrl("/contact/"));
  });
  // the growth tips route
  app.get("/blog", function (req, res) {
    res.redirect(marketingUrl("/blog/"));
  });
  // blog post how to brew the perfect cup route
  app.get("/how-to-brew-the-perfect-cup", function (req, res) {
    res.redirect(marketingUrl("/blog/how-to-brew-the-perfect-cup/"));
  });

  // authentication routes =========================================================
  // profile route
  app.get("/profile", isLoggedIn, async function (req, res) {
    try {
      const result = await db.collection("order").find().toArray();
      const orders = result.filter((h) => h.completed === false);
      const completedOrders = result.filter((h) => h.completed === true);

      res.render("profile.ejs", {
        user: req.user, // get the user out of session and pass to template
        orders,
        completed: completedOrders,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Unable to load profile.");
    }
  });
  // order taker route TODO: make sure to put back isLoggedIn for production
  app.get("/order-dashboard", isLoggedIn, async function (req, res) {
    try {
      const result = await db.collection("order").find().toArray();
      const orders = result.filter((h) => h.completed === false);
      const completedOrders = result.filter((h) => h.completed === true);

      res.render("order-dashboard.ejs", {
        user: req.user, // get the user out of session and pass to template
        orders,
        completed: completedOrders,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Unable to load order dashboard.");
    }
  });
  // barista make drinks route
  app.get("/barista-order-dashboard", isLoggedIn, async function (req, res) {
    try {
      const result = await db.collection("order").find().toArray();
      const orders = result.filter((h) => h.completed === false);
      const completedOrders = result.filter((h) => h.completed === true);

      res.render("barista-order-dashboard.ejs", {
        user: req.user, // get the user out of session and pass to template
        orders,
        completed: completedOrders,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Unable to load barista dashboard.");
    }
  });

  // login routes ===============================================================
  // the login form route
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });
  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login",
      failureFlash: true,
    })
  );

  // signup form route
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });
  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile",
      failureRedirect: "/signup",
      failureFlash: true,
    })
  );

  // logout route error fixed with https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function
  app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect(marketingUrl("/"));
    });
  });

  // create new order
  app.post("/submitNewOrder", async (req, res) => {
    console.log(req.body); // coming from order-dashboard.js
    console.log(
      `Name for order: ${req.body.name} Order:${req.body.order} Order taken by ${req.body.orderTaker}`
    );
    try {
      await db.collection("order").insertOne({
        name: req.body.name,
        order: req.body.order,
        completed: false,
        orderTaker: req.body.orderTaker,
        barista: "", //field will be updated by the barista when order is complete
      });
      console.log("saved to database");
      res.redirect("/order-dashboard");
    } catch (err) {
      console.log(err);
      res.status(500).send("Unable to create order.");
    }
  });
  // update order
  app.put("/messages/like", async (req, res) => {
    try {
      const result = await db.collection("order").findOneAndUpdate(
        {
        _id: ObjectId(req.body.id),
        },
        {
          $set: {
            completed: true,
            barista: req.body.barista,
          },
        },
        {
          sort: { _id: -1 },
          upsert: true,
        }
      );

      res.send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  });
  // delete order
  app.delete("/messages", async (req, res) => {
    try {
      await db.collection("order").findOneAndDelete({
        _id: ObjectId(req.body.id),
      });
      res.send("Message deleted!");
    } catch (err) {
      res.status(500).send(err);
    }
  });
  // TODO: add routes for the following:
  app.get("/unlink/local", isLoggedIn, async function (req, res) {
    const user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    try {
      await user.save();
      res.redirect("/profile");
    } catch (err) {
      res.status(500).send(err);
    }
  });

  app.use((req, res) => {
    res.status(404).render("404.ejs", {
      marketingBaseUrl: app.locals.marketingBaseUrl,
    });
  });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they aren't redirect them to the login page
  res.redirect("/login");
}
