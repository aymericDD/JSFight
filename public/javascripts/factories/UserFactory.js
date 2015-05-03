/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function UserFactory($http) {
        function User(username, password, id) {
            this.username = username;
            this.password = password;
            this.id = id;
        }

        /** Instance Methods **/
        User.prototype.login = function register(next) {
            var self = this;

            $http.post("/api/v1/auth/login", self)
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        User.prototype.register = function register(next) {
            var self = this;

            $http.post("/api/v1/auth/register", self)
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        /** Static Methods **/
        User.load = function load(next) {
            $http.get("/api/v1/auth/me")
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        User.logout = function load(next) {
            $http.get("/api/v1/auth/logout")
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        return User;
    }

    /** Angular.JS Dependency Injection **/
    UserFactory.$inject = ["$http"];

    /** Angular.JS Factory Registration **/
    _JSFight.factory("User", UserFactory);
}());