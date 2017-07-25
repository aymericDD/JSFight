"use strict";

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSessions = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
require("./authentication/passport-configuration");

var defaultRoutes = require('./routes/defaultRoutes');
var authApiV1 = require('./routes/authApiV1');
var userApiV1 = require('./routes/userApiV1');

/** MongoDB **/
mongoose.connect('mongodb://localhost/JSFight');

var app = express();


/** Socket.IO **/
var server = require('http').Server(app);
var io = require('socket.io')(server);

var http=require('http');
var ports = [1337, 3333];
var servers = [];
var s;
ports.forEach(function(port) {
    s = http.Server(app);
    var io = require('socket.io')(s);
    if(port === 1337) {
        require('./helpers/socketChatHandler')(io);
    }
    if(port == 3333) {
        require('./helpers/socketGameHandler')(io);
    }
    s.listen(port);
    servers.push(s);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSessions({
  secret: "mySecret",
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', defaultRoutes);
app.use('/api/v1/auth', authApiV1);
app.use('/api/v1/user', userApiV1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('content/full/error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('content/full/error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;


function gracefulExit() {
    console.log("NodeJS server graceful exit...");
    mongoose.connection.close(function () {
        console.log("MongoDB server connection closed.");

        console.log("Exiting node...");
        process.exit(0);
    });
}

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

