const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 3000;
const CONFIG = require('./config/config.json');

// authentication middleware
const passport = require('passport');
//  strategy used to allow users to authenticate with a username and password
const LocalStrategy = require('passport-local').Strategy;

// session middleware
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// password hashing
const saltRounds = 12;
const bcrypt = require('bcrypt');

// used to extract the entire body portion of an incoming request stream and exposes it on req.body
const bodyParser = require('body-parser');

// create express app
const app = express();

const User = require('./models/User');

// instantiate body parser
app.use(bodyParser.urlencoded({ extended: true }));

// session setup
app.use(
  session({
    store: new RedisStore(),
    // replace with your own secret
    secret: CONFIG.SESSION_SECRET,
    name: 'auth_session',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 10000000
    }
  })
);

// passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('serializing'); // given from auth strategy

  // building the object to serialize to save
  return done(null, {
    id: user.id,
    username: user.username
  });
});

passport.deserializeUser((user, done) => {
  console.log('deserializing'); // given from serializeUser

  return new User({ id: user.id }).fetch().then(user => {
    user = user.toJSON();
    return done(null, {
      id: user.id,
      username: user.username
    });
  });
});

passport.use(
  new LocalStrategy((username, password, done) => {
    new User({ username: username })
      .fetch()
      .then(user => {
        if (user === null) {
          return done(null, false, { message: 'invalid username or password' });
        } else {
          user = user.toJSON();
          bcrypt.compare(password, user.password).then(res => {
            if (res) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: 'invalid username or password'
              });
            }
          });
        }
      })
      .catch(err => {
        console.log('error: ', err);
      });
  })
);

/****** ROUTES *******/

app.get('/', (req, res) => {
  res.send('aloha');
});

// login
app
  .route('/login')
  .get((req, res) => {
    res.send('please log in');
  })
  .post(
    passport.authenticate('local', {
      successRedirect: '/secret',
      failureRedirect: '/login'
    })
  );

// register new user
app
  .route('/register')
  .get((req, res) => {
    res.send('register');
  })
  .post((req, res) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        let { username } = req.body;
        return new User({ username, password: hash })
          .save()
          .then(user => {
            return res.redirect('/login');
          })
          .catch(err => {
            console.log('error message: ', err);
          });
      });
    });
  });

app.get('/secret', isAuthenticated, (req, res) => {
  res.send('YOU HAVE SUCCESSFULLY ENTERED THE SECRET PAGE ;)');
});

// custom middleware used to secure routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('you may pass');
    next();
  } else {
    console.log('you shall not pass');
    res.redirect('/login');
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
