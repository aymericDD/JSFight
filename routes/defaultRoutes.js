"use strict";

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('content/full/index');
});

router.get('/ng/login', function (req, res, next) {
    res.render('content/ng/login');
});

router.get('/ng/lobby', function (req, res, next) {
    res.render('content/ng/lobby');
});

router.get('/ng/game', function (req, res, next) {
    res.render('content/ng/game');
});

router.get('/images/:image', function (req, res, next) {
    res.render('/public/images/');
});

module.exports = router;
