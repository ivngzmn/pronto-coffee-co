module.exports = function (app, passport, db, ObjectId) {
  app.get('/', function (req, res) {
    res.render('index.ejs', { outcome: null });
  });

  app.get('/profile', isLoggedIn, function (req, res) {
    db.collection('order')
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        let orders = result.filter((h) => h.completed === false);
        let completedOrders = result.filter((h) => h.completed === true);

        res.render('profile.ejs', {
          user: req.user,
          orders: orders,
          completed: completedOrders,
        });
      });
  });

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.post('/', (req, res) => {
    console.log('name for order', req.body.name);
    db.collection('order').save(
      {
        name: req.body.name,
        order: req.body.order,
        completed: false,
        barista: '',
      },
      (err, savedResult) => {
        if (err) return console.log(err);
        console.log('saved to database');
        res.render('index.ejs');
      }
    );
  });

  app.put('/messages/like', (req, res) => {
    db.collection('order').findOneAndUpdate(
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

  app.delete('/messages', (req, res) => {
    db.collection('order').findOneAndDelete(
      {
        _id: ObjectId(req.body.id),
      },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send('Message deleted!');
      }
    );
  });

  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  app.post(
    '/login',
    passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true,
    })
  );

  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  app.post(
    '/signup',
    passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/signup',
      failureFlash: true,
    })
  );

  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect('/');
}
