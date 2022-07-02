module.exports = function (app, passport, db, ObjectId) {
  // normal routes ===============================================================
  // home route
  app.get("/", function (req, res) {
    res.render("index.ejs", { outcome: null }); // load the index.ejs file
  });
  // the contact route
  app.get("/contact", function (req, res) {
    res.render("contact.ejs");
  });
  // the growth tips route
  app.get("/blog", function (req, res) {
    res.render("blog.ejs");
  });
  // blog post how to brew the perfect cup route
  app.get("/how-to-brew-the-perfect-cup", function (req, res) {
    res.render("how-to-brew-the-perfect-cup.ejs");
  });

  // authentication routes =========================================================
  // profile route
  app.get("/profile", isLoggedIn, function (req, res) {
    db.collection("order")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        let orders = result.filter((h) => h.completed === false);
        let completedOrders = result.filter((h) => h.completed === true);

        res.render("profile.ejs", {
          user: req.user, // get the user out of session and pass to template
          orders: orders,
          completed: completedOrders,
        });
      });
  });
  // order taker route TODO: make sure to put back isLoggedIn for production
  app.get("/order-dashboard", isLoggedIn, function (req, res) {
    db.collection("order")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        let orders = result.filter((h) => h.completed === false);
        let completedOrders = result.filter((h) => h.completed === true);

        res.render("order-dashboard.ejs", {
          user: req.user, // get the user out of session and pass to template
          orders: orders,
          completed: completedOrders,
        });
      });
  });
  // barista make drinks route
  app.get("/barista-order-dashboard", isLoggedIn, function (req, res) {
    db.collection("order")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        let orders = result.filter((h) => h.completed === false);
        let completedOrders = result.filter((h) => h.completed === true);

        res.render(
          "barista-order-dashboard.ejs",

          {
            user: req.user, // get the user out of session and pass to template
            orders: orders,
            completed: completedOrders,
          }
        );
      });
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
      res.redirect("/");
    });
  });

  // create new order
  app.post("/submitNewOrder", (req, res) => {
    console.log(req.body); // coming from order-dashboard.js
    console.log(
      `Name for order: ${req.body.name} Order:${req.body.order} Order taken by ${req.body.orderTaker}`
    );
    db.collection("order").insertOne(
      {
        name: req.body.name,
        order: req.body.order,
        completed: false,
        orderTaker: req.body.orderTaker,
        barista: "", //field will be updated by the barista when order is complete
      },
      (err, savedResult) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.render("index.ejs");
      }
    );
  });
  // update order
  app.put("/messages/like", (req, res) => {
    db.collection("order").findOneAndUpdate(
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
      },
      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });
  // delete order
  app.delete("/messages", (req, res) => {
    db.collection("order").findOneAndDelete(
      {
        _id: ObjectId(req.body.id),
      },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });
  // TODO: add routes for the following:
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    const user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they aren't redirect them to the home page
  res.redirect("/");
}
