/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function UserFactory($http) {
        function User(username, nbParts, nbWins, nbLoss, id) {
            this.username = username;
            this.nbParts = nbParts;
            this.nbWins = nbWins;
            this.nbLoss = nbLoss;
            this.id = id;
        }

        /**
         * Check if user is logged
         *
         * @param next
         */
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

        /**
         * Save user into databases
         *
         * @param next
         */
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

        /**
         * Update user
         *
         * @param next
         */
        User.prototype.update = function update(next) {
            var self = this;

            $http.put("api/v1/user/" + self.id, self)
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        /**
         * Get all users
         *
         * @param next
         */
        User.all = function all(next) {
            $http.get("api/v1/user/all")
                .success(function(data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };


        /**
         * Return data user
         *
         * @param next
         */
        User.load = function load(next) {
            $http.get("/api/v1/auth/me")
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        /**
         * Logout user
         *
         * @param next
         */
        User.logout = function logout(next) {
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