var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./users/userModel.js');
var Game = require('./games/gamesModel.js');
var Rom = require('./games/romsModel.js');
var library = require('./gameLibrary.js');
var romLibrary = require('./romLibrary.js');

var app = express();

// Configure express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/../client'));

var port = process.env.PORT || 3000;
app.listen(port);

// Configure passport authorization
app.use(session({secret: 'orange quicksand'}));
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
  // findById(id, function (err, user) {
  //   done(err, user);
  // });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { message: 'Unknown user ' + username });
    }
    if (user.password === password) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Invalid password' });
    }
  });
}));

// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     process.nextTick(function () {
//       findByUsername(username, function(err, user) {
//         if (err) { return done(err); }
//         if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
//         if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
//         return done(null, user);
//       })
//     });
//   }
// ));

var ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};



// Create mongo database
var location = process.env.LOC || 'localhost/orangequicksand';
mongoose.connect('mongodb://' + location);

// Initialize database with test game info
for (var i = 0; i < library.length; i++) {
  new Game(library[i]).save();
}

for (var i = 0; i < romLibrary.length; i++) {
  new Rom(romLibrary[i]).save();
}


// Routing for homepage
app.get('/api/games', function(req, res){
  Game.find(function(err, results) {
    res.send(results);
  });
});

// Determines which game to send
app.param('code', function(req, res, next, code){
  req.id = code;
  next();
});

// Routing for game page
app.get('/api/game/:code', function(req, res){
  var id = req.id;
  Rom.find({id: id}, function(err, results) {
    res.send(results);
  });
});

// Routing for registering page
app.post('/user/register', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, found) {
    if (found) {
      res.send(false);
    } else {
      new User({
        username: username,
        password: password
      }).save();
      res.send(true);
    }
  });
});
